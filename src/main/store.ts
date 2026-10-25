import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { resolveVisit } from '../domain/catalog';
import { levels, type Settings, type Snapshot, type Visit, type VisitInput, type PracticeAttempt, type PracticeSession } from '../shared/contracts';
import { a1Scaffold, canonicalJSON, validateScaffold } from '../domain/framework';
import type { ApplicationRecord, FrameworkProgress, LearningCoverageRecord } from '../domain/progress';
import { isFontSize } from '../shared/typography';
import { studioPack, studioUnit, validateStudioPack, questionsForScope, gradeQuestion, type StudioPack, type Answer, type PracticeQuestion } from '../domain/studio21';

const defaults: Settings = { level: 'A1', fontSize: 'standard', reducedMotion: false };

export function validateSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object') throw new Error('设置格式不正确。');
  const s = value as Record<string, unknown>;
  if (!levels.includes(s.level as Settings['level']) ||
      !isFontSize(s.fontSize) || typeof s.reducedMotion !== 'boolean' ||
      Object.keys(s).some(key => !['level', 'fontSize', 'reducedMotion'].includes(key))) {
    throw new Error('设置值不在允许的范围内。');
  }
  return { level: s.level as Settings['level'], fontSize: s.fontSize as Settings['fontSize'], reducedMotion: s.reducedMotion };
}

export class LocalStore {
  private db: DatabaseSync;
  constructor(private path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    const version = this.db.prepare('PRAGMA user_version').get() as { user_version: number };
    if (version.user_version > 3) {
      this.db.close();
      throw new Error('本地档案来自较新版本，请使用兼容的 DeutschLab。');
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
    try {
      this.db.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS app_settings (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS browsing_history (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('course', 'topic', 'quest')),
        ref_id TEXT NOT NULL, title TEXT NOT NULL, visited_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS framework_revisions (
        catalog_id TEXT NOT NULL, revision TEXT NOT NULL, framework_json TEXT NOT NULL, ability_json TEXT NOT NULL,
        imported_at TEXT NOT NULL, PRIMARY KEY(catalog_id, revision)
      );
      CREATE TABLE IF NOT EXISTS framework_catalogs (
        catalog_id TEXT PRIMARY KEY, tree_id TEXT NOT NULL, active_revision TEXT NOT NULL,
        FOREIGN KEY(catalog_id, active_revision) REFERENCES framework_revisions(catalog_id, revision)
      );
      CREATE TABLE IF NOT EXISTS learning_coverage (
        catalog_id TEXT NOT NULL, unit_id TEXT NOT NULL,
        coverage_status TEXT NOT NULL CHECK(coverage_status IN ('not_started', 'partially_covered', 'studied')),
        covered_outline_ids TEXT NOT NULL CHECK(json_valid(covered_outline_ids) AND json_type(covered_outline_ids) = 'array'),
        updated_at TEXT NOT NULL, PRIMARY KEY(catalog_id, unit_id)
      );
      CREATE TABLE IF NOT EXISTS ability_progress (
        catalog_id TEXT NOT NULL, node_id TEXT NOT NULL,
        application_status TEXT NOT NULL CHECK(application_status IN ('not_assessed', 'in_practice', 'self_reported', 'evidence_supported')),
        source TEXT NOT NULL CHECK(source IN ('none', 'practice', 'self', 'assessment')),
        evidence_ids TEXT NOT NULL CHECK(json_valid(evidence_ids) AND json_type(evidence_ids) = 'array'),
        note TEXT, updated_at TEXT NOT NULL,
        CHECK(application_status != 'self_reported' OR source = 'self'),
        CHECK(application_status != 'evidence_supported' OR (source = 'assessment' AND json_array_length(evidence_ids) > 0)),
        PRIMARY KEY(catalog_id, node_id)
      );
      CREATE TABLE IF NOT EXISTS course_content_revisions (
        unit_id TEXT NOT NULL, revision TEXT NOT NULL, payload TEXT NOT NULL, imported_at TEXT NOT NULL,
        PRIMARY KEY(unit_id, revision)
      );
      CREATE TABLE IF NOT EXISTS course_content_active (
        unit_id TEXT PRIMARY KEY, revision TEXT NOT NULL,
        FOREIGN KEY(unit_id, revision) REFERENCES course_content_revisions(unit_id, revision)
      );
      CREATE TABLE IF NOT EXISTS course_manual_state (
        unit_id TEXT PRIMARY KEY, textbook_done INTEGER NOT NULL DEFAULT 0 CHECK(textbook_done IN (0, 1)),
        recording_done INTEGER NOT NULL DEFAULT 0 CHECK(recording_done IN (0, 1)), updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS course_position (
        unit_id TEXT PRIMARY KEY, location TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS card_views (
        id TEXT PRIMARY KEY, unit_id TEXT NOT NULL, card_id TEXT NOT NULL,
        content_revision TEXT NOT NULL, viewed_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id TEXT PRIMARY KEY, unit_id TEXT NOT NULL, scope TEXT NOT NULL,
        content_revision TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS practice_attempts (
        id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES practice_sessions(id),
        question_id TEXT NOT NULL, knowledge_id TEXT NOT NULL, answer_json TEXT NOT NULL,
        correct INTEGER NOT NULL CHECK(correct IN (0, 1)), hint_viewed INTEGER NOT NULL CHECK(hint_viewed IN (0, 1)),
        card_viewed INTEGER NOT NULL CHECK(card_viewed IN (0, 1)), answered_at TEXT NOT NULL,
        content_revision TEXT NOT NULL, grading_rule_version TEXT NOT NULL, question_snapshot TEXT NOT NULL,
        UNIQUE(session_id, question_id)
      );
      PRAGMA user_version = 3;
    `);
      this.db.prepare('INSERT OR IGNORE INTO app_settings (id, payload) VALUES (1, ?)').run(JSON.stringify(defaults));
      this.db.exec('COMMIT;');
      this.importScaffold(a1Scaffold.framework, a1Scaffold.ability);
      this.importStudioPack(studioPack);
    } catch (error) {
      try { this.db.exec('ROLLBACK;'); } catch { /* No pending transaction. */ }
      this.db.close();
      throw error;
    }
  }
  importScaffold(framework: unknown, ability: unknown) {
    const validated = validateScaffold(framework, ability);
    const frameworkJSON = canonicalJSON(validated.framework);
    const abilityJSON = canonicalJSON(validated.ability);
    const catalogId = validated.framework.catalog_id;
    const revision = createHash('sha256').update(canonicalJSON({ framework: validated.framework, ability: validated.ability })).digest('hex');
    const existing = this.db.prepare('SELECT 1 FROM framework_revisions WHERE catalog_id = ? AND revision = ?').get(catalogId, revision);
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare('INSERT OR IGNORE INTO framework_revisions (catalog_id, revision, framework_json, ability_json, imported_at) VALUES (?, ?, ?, ?, ?)')
        .run(catalogId, revision, frameworkJSON, abilityJSON, new Date().toISOString());
      this.db.prepare(`INSERT INTO framework_catalogs (catalog_id, tree_id, active_revision) VALUES (?, ?, ?)
        ON CONFLICT(catalog_id) DO UPDATE SET tree_id = excluded.tree_id, active_revision = excluded.active_revision`)
        .run(catalogId, validated.ability.tree_id, revision);
      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
    // Catalog import deliberately performs no writes to either user-progress table.
    return { catalogId, revision, alreadyImported: !!existing, counts: validated.framework.counts };
  }
  importStudioPack(input: unknown) {
    const otherUnit = (input as StudioPack | null)?.unit?.id !== studioUnit.id;
    const pack = validateStudioPack(input, otherUnit ? studioPack.cards : []);
    const payload = canonicalJSON(pack);
    const revision = createHash('sha256').update(payload).digest('hex');
    const exists = !!this.db.prepare('SELECT 1 FROM course_content_revisions WHERE unit_id = ? AND revision = ?').get(pack.unit.id, revision);
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare('INSERT OR IGNORE INTO course_content_revisions VALUES (?, ?, ?, ?)').run(pack.unit.id, revision, payload, new Date().toISOString());
      this.db.prepare(`INSERT INTO course_content_active (unit_id, revision) VALUES (?, ?)
        ON CONFLICT(unit_id) DO UPDATE SET revision = excluded.revision`).run(pack.unit.id, revision);
      this.db.exec('COMMIT;');
    } catch (error) { this.db.exec('ROLLBACK;'); throw error; }
    return { revision, alreadyImported: exists };
  }
  private activeRevision(): string {
    const row = this.db.prepare('SELECT revision FROM course_content_active WHERE unit_id = ?').get(studioUnit.id) as { revision: string };
    return row.revision;
  }
  private setPosition(location: string) {
    this.db.prepare(`INSERT INTO course_position VALUES (?, ?, ?) ON CONFLICT(unit_id)
      DO UPDATE SET location = excluded.location, updated_at = excluded.updated_at`).run(studioUnit.id, location, new Date().toISOString());
  }
  private courseProgress(): Snapshot['courseProgress'] {
    const manual = this.db.prepare('SELECT textbook_done AS textbookDone, recording_done AS recordingDone FROM course_manual_state WHERE unit_id = ?').get(studioUnit.id) as { textbookDone: number; recordingDone: number } | undefined;
    const position = this.db.prepare('SELECT location FROM course_position WHERE unit_id = ?').get(studioUnit.id) as { location: string } | undefined;
    const viewedCardIds = this.db.prepare('SELECT DISTINCT card_id AS cardId FROM card_views WHERE unit_id = ? ORDER BY rowid').all(studioUnit.id).map(row => String(row.cardId));
    const sessions = this.db.prepare(`SELECT id, scope, content_revision AS contentRevision, created_at AS createdAt, completed_at AS completedAt
      FROM practice_sessions WHERE unit_id = ? ORDER BY rowid DESC`).all(studioUnit.id).map(row => ({ ...row })) as unknown as PracticeSession[];
    const attempts = this.db.prepare(`SELECT a.id, a.session_id AS sessionId, a.question_id AS questionId, a.knowledge_id AS knowledgeId,
      a.answer_json AS answerJson, a.correct, a.hint_viewed AS hintViewed, a.card_viewed AS cardViewed,
      a.answered_at AS answeredAt, a.content_revision AS contentRevision, a.grading_rule_version AS gradingRuleVersion,
      a.question_snapshot AS questionSnapshot FROM practice_attempts a JOIN practice_sessions s ON s.id = a.session_id
      WHERE s.unit_id = ? ORDER BY a.rowid DESC`).all(studioUnit.id).map(row => ({
        id: String(row.id), sessionId: String(row.sessionId), questionId: String(row.questionId), knowledgeId: String(row.knowledgeId),
        answer: JSON.parse(String(row.answerJson)) as Answer, correct: Boolean(row.correct), hintViewed: Boolean(row.hintViewed),
        cardViewed: Boolean(row.cardViewed), answeredAt: String(row.answeredAt), contentRevision: String(row.contentRevision),
        gradingRuleVersion: String(row.gradingRuleVersion), questionSnapshot: String(row.questionSnapshot),
      })) satisfies PracticeAttempt[];
    return { textbookDone: Boolean(manual?.textbookDone), recordingDone: Boolean(manual?.recordingDone), lastLocation: position?.location ?? null, viewedCardIds, sessions, attempts };
  }
  private frameworkProgress(): FrameworkProgress {
    const learningRows = this.db.prepare(`SELECT unit_id AS unitId, coverage_status AS status,
      covered_outline_ids AS coveredOutlineIds, updated_at AS updatedAt FROM learning_coverage WHERE catalog_id = ?`).all(a1Scaffold.framework.catalog_id);
    const applicationRows = this.db.prepare(`SELECT node_id AS nodeId, application_status AS status, source,
      evidence_ids AS evidenceIds, note, updated_at AS updatedAt FROM ability_progress WHERE catalog_id = ?`).all(a1Scaffold.framework.catalog_id);
    return {
      learning: Object.fromEntries(learningRows.map(row => [String(row.unitId), { ...row, coveredOutlineIds: JSON.parse(String(row.coveredOutlineIds)) } as LearningCoverageRecord])),
      application: Object.fromEntries(applicationRows.map(row => [String(row.nodeId), { ...row, evidenceIds: JSON.parse(String(row.evidenceIds)) } as ApplicationRecord])),
    };
  }
  snapshot(): Snapshot {
    const row = this.db.prepare('SELECT payload FROM app_settings WHERE id = 1').get() as { payload: string };
    const visits = this.db.prepare(`SELECT id, kind, ref_id AS refId, title, visited_at AS visitedAt
      FROM browsing_history ORDER BY rowid DESC LIMIT 100`).all().map(row => ({ ...row })) as unknown as Visit[];
    return { settings: validateSettings(JSON.parse(row.payload)), visits, frameworkProgress: this.frameworkProgress(), courseProgress: this.courseProgress(), storage: { mode: 'sqlite', path: this.path } };
  }
  updateSettings(value: unknown): Snapshot {
    const settings = validateSettings(value);
    this.db.prepare('UPDATE app_settings SET payload = ? WHERE id = 1').run(JSON.stringify(settings));
    return this.snapshot();
  }
  recordVisit(value: unknown): Snapshot {
    if (!value || typeof value !== 'object') throw new Error('浏览记录格式不正确。');
    const v = value as VisitInput;
    if (typeof v.refId !== 'string' || !['course', 'topic', 'quest'].includes(v.kind)) throw new Error('浏览对象不正确。');
    const title = resolveVisit(v.kind, v.refId);
    if (!title) throw new Error('浏览对象不存在。');
    this.db.prepare('INSERT INTO browsing_history (id, kind, ref_id, title, visited_at) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), v.kind, v.refId, title, new Date().toISOString());
    return this.snapshot();
  }
  setMaterialStatus(field: unknown, done: unknown): Snapshot {
    if (!['textbookDone', 'recordingDone'].includes(String(field)) || typeof done !== 'boolean') throw new Error('教材状态无效。');
    const column = field === 'textbookDone' ? 'textbook_done' : 'recording_done';
    this.db.prepare('INSERT OR IGNORE INTO course_manual_state (unit_id, updated_at) VALUES (?, ?)').run(studioUnit.id, new Date().toISOString());
    this.db.prepare(`UPDATE course_manual_state SET ${column} = ?, updated_at = ? WHERE unit_id = ?`).run(done ? 1 : 0, new Date().toISOString(), studioUnit.id);
    return this.snapshot();
  }
  viewKnowledgeCard(cardId: unknown, preservePosition: unknown = false): Snapshot {
    const card = studioPack.cards.find(item => item.id === cardId);
    if (!card || typeof preservePosition !== 'boolean') throw new Error('知识卡不存在或浏览状态无效。');
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare('INSERT INTO card_views VALUES (?, ?, ?, ?, ?)').run(randomUUID(), studioUnit.id, card.id, this.activeRevision(), new Date().toISOString());
      if (!preservePosition) this.setPosition(`/focus/studio21/${card.id}`);
      this.db.exec('COMMIT;');
    } catch (error) { this.db.exec('ROLLBACK;'); throw error; }
    return this.snapshot();
  }
  startPractice(scope: unknown, restart: unknown = false): Snapshot {
    if (typeof scope !== 'string' || !questionsForScope(scope).length || typeof restart !== 'boolean') throw new Error('练习范围无效。');
    const revision = this.activeRevision();
    const active = this.db.prepare(`SELECT id FROM practice_sessions WHERE unit_id = ? AND scope = ?
      AND content_revision = ? AND completed_at IS NULL ORDER BY rowid DESC LIMIT 1`).get(studioUnit.id, scope, revision) as { id: string } | undefined;
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      if (!active || restart) this.db.prepare('INSERT INTO practice_sessions (id, unit_id, scope, content_revision, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), studioUnit.id, scope, revision, new Date().toISOString());
      this.setPosition(`/focus/studio21/practice/${scope}`);
      this.db.exec('COMMIT;');
    } catch (error) { this.db.exec('ROLLBACK;'); throw error; }
    return this.snapshot();
  }
  private sessionQuestion(sessionId: unknown, questionId: unknown): { session: { scope: string; content_revision: string; completed_at: string | null }; question: PracticeQuestion } {
    if (typeof sessionId !== 'string' || typeof questionId !== 'string') throw new Error('练习记录无效。');
    const session = this.db.prepare('SELECT scope, content_revision, completed_at FROM practice_sessions WHERE id = ? AND unit_id = ?').get(sessionId, studioUnit.id) as { scope: string; content_revision: string; completed_at: string | null } | undefined;
    if (!session || session.completed_at) throw new Error('练习已结束或不存在。');
    const row = this.db.prepare('SELECT payload FROM course_content_revisions WHERE unit_id = ? AND revision = ?').get(studioUnit.id, session.content_revision) as { payload: string } | undefined;
    if (!row) throw new Error('旧版题目内容缺失。');
    const pack = JSON.parse(row.payload) as StudioPack;
    const question = questionsForScope(session.scope, pack).find(item => item.id === questionId);
    if (!question) throw new Error('题目不属于当前练习。');
    return { session, question };
  }
  submitAnswer(sessionId: unknown, questionId: unknown, answer: unknown, hintViewed: unknown, cardViewed: unknown): Snapshot {
    const { session, question } = this.sessionQuestion(sessionId, questionId);
    if (typeof hintViewed !== 'boolean' || typeof cardViewed !== 'boolean') throw new Error('答题状态无效。');
    const valid = question.type === 'single'
      ? typeof answer === 'string' && !!question.options?.some(item => item.id === answer)
      : question.type === 'fill'
        ? typeof answer === 'string' && !!answer.trim()
        : Array.isArray(answer) && answer.length === (question.type === 'match' ? question.left : question.tokens)?.length
          && answer.every(id => typeof id === 'string' && (question.type === 'match' ? question.right : question.tokens)?.some(item => item.id === id))
          && new Set(answer).size === answer.length;
    if (!valid) throw new Error('请先完成当前题目。');
    const gradingRuleVersion = question.type === 'fill' ? question.gradingRule! : 'exact-structured-answer-v1';
    this.db.prepare(`INSERT INTO practice_attempts
      (id, session_id, question_id, knowledge_id, answer_json, correct, hint_viewed, card_viewed,
       answered_at, content_revision, grading_rule_version, question_snapshot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), sessionId as string, question.id, question.knowledgeId,
        JSON.stringify(answer), gradeQuestion(question, answer as Answer) ? 1 : 0, hintViewed ? 1 : 0, cardViewed ? 1 : 0,
        new Date().toISOString(), session.content_revision, gradingRuleVersion, canonicalJSON(question));
    return this.snapshot();
  }
  completePractice(sessionId: unknown): Snapshot {
    if (typeof sessionId !== 'string') throw new Error('练习 ID 无效。');
    const session = this.db.prepare('SELECT scope, content_revision, completed_at FROM practice_sessions WHERE id = ? AND unit_id = ?').get(sessionId, studioUnit.id) as { scope: string; content_revision: string; completed_at: string | null } | undefined;
    if (!session) throw new Error('练习不存在。');
    if (session.completed_at) return this.snapshot();
    const row = this.db.prepare('SELECT payload FROM course_content_revisions WHERE unit_id = ? AND revision = ?').get(studioUnit.id, session.content_revision) as { payload: string };
    const expected = questionsForScope(session.scope, JSON.parse(row.payload) as StudioPack).length;
    const actual = (this.db.prepare('SELECT count(*) AS n FROM practice_attempts WHERE session_id = ?').get(sessionId) as { n: number }).n;
    if (actual !== expected) throw new Error('练习尚未完成。');
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare('UPDATE practice_sessions SET completed_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId);
      this.setPosition(session.scope === 'assessment' ? `/courses/${studioUnit.id}` : `/courses/${studioUnit.id}/sections/${session.scope}`);
      this.db.exec('COMMIT;');
    } catch (error) { this.db.exec('ROLLBACK;'); throw error; }
    return this.snapshot();
  }
  close() { this.db.close(); }
}
