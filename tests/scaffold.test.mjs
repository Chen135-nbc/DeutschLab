import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { LocalStore } = require('../dist/main/store.cjs');
const { a1Scaffold, createScaffold, validateScaffold, canonicalJSON, getFrameworkUnit, searchFramework } = require('../dist/domain/framework.cjs');
const { coverageFor, applicationFor } = require('../dist/domain/progress.cjs');
const framework = JSON.parse(readFileSync(new URL('../content/frameworks/a1/a1_extension_framework.json', import.meta.url), 'utf8'));
const ability = JSON.parse(readFileSync(new URL('../content/frameworks/a1/a1_ability_tree.json', import.meta.url), 'utf8'));
const databasePath = () => join(mkdtempSync(join(tmpdir(), 'deutschlab-a1-')), 'profile.sqlite');
const emptyProgress = () => ({ learning: {}, application: {} });

test('A1 骨架完整保留 8 板块、68 单元、207 内容项、16 完成目标及源顺序', () => {
  const scaffold = createScaffold(framework, ability);
  assert.equal(scaffold.boards.length, 8);
  assert.equal(scaffold.units.length, 68);
  assert.equal(scaffold.outlineItems.length, 207);
  assert.equal(scaffold.abilityNodes.length, 68);
  assert.equal(ability.tree.children.flatMap(branch => branch.completion_criteria).length, 16);
  assert.deepEqual(scaffold.boards, framework.boards);
  for (const branch of ability.tree.children) {
    const board = scaffold.boardById.get(branch.source_catalog_id);
    assert.equal(board.title, branch.title);
    assert.deepEqual(branch.children.map(node => node.source_catalog_id), board.units.map(unit => unit.id));
    assert.deepEqual(branch.completion_criteria.map(goal => goal.description), board.completion_criteria);
    for (const node of branch.children) {
      const unit = scaffold.unitById.get(node.source_catalog_id);
      assert.equal(unit.title, node.title);
      assert.deepEqual(node.outline_refs, unit.outline.map(item => item.id));
      assert.deepEqual(node.skill_leaf_ids, []);
      assert.deepEqual(unit.course_links, []);
      assert.deepEqual(unit.quest_links, []);
    }
  }
  const ids = [...scaffold.boards, ...scaffold.units, ...scaffold.outlineItems, ...ability.tree.children, ...scaffold.abilityNodes, ...ability.tree.children.flatMap(branch => branch.completion_criteria)].map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(getFrameworkUnit(ability.tree.children[0].children[0].source_catalog_id), a1Scaffold.units[0]);
});

test('目录可搜索单元标题与只有细分内容中出现的文本', () => {
  assert.deepEqual(searchFramework('ä/ö/ü').map(result => result.unit.id), ['A1-B01-U01']);
  assert.ok(searchFramework('基础办公室交流').some(result => result.unit.id === 'A1-B08-U10'));
  assert.equal(searchFramework('not-a-topic-987').length, 0);
});

test('重复导入及仅对象键顺序变化不重复创建内容，也不生成用户学习记录', () => {
  const path = databasePath();
  const store = new LocalStore(path);
  const first = store.importScaffold(framework, ability);
  const second = store.importScaffold(JSON.parse(canonicalJSON(framework)), JSON.parse(canonicalJSON(ability)));
  assert.equal(first.alreadyImported, true);
  assert.equal(second.alreadyImported, true);
  assert.equal(first.revision, second.revision);
  assert.deepEqual(store.snapshot().frameworkProgress, emptyProgress());
  store.recordVisit({ kind: 'topic', refId: 'A1-B01-U01' });
  assert.deepEqual(store.snapshot().frameworkProgress, emptyProgress());
  store.close();
  const db = new DatabaseSync(path);
  assert.equal(db.prepare('SELECT count(*) AS n FROM framework_catalogs').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM framework_revisions').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM learning_coverage').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM ability_progress').get().n, 0);
  db.close();
});

test('旧 v1 档案的设置和浏览历史在事务升级后完整保留', () => {
  const path = databasePath();
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE app_settings (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);
    CREATE TABLE browsing_history (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('course', 'topic', 'quest')), ref_id TEXT NOT NULL, title TEXT NOT NULL, visited_at TEXT NOT NULL);
    PRAGMA user_version = 1;`);
  const settings = { level: 'A2', fontSize: 'large', reducedMotion: true };
  db.prepare('INSERT INTO app_settings VALUES (1, ?)').run(JSON.stringify(settings));
  db.prepare('INSERT INTO browsing_history VALUES (?, ?, ?, ?, ?)').run('old-visit', 'topic', 'demo.topic.introductions', '认识彼此', '2026-10-01T00:00:00Z');
  db.close();
  const store = new LocalStore(path);
  assert.deepEqual(store.snapshot().settings, settings);
  assert.deepEqual(store.snapshot().visits, [{ id: 'old-visit', kind: 'topic', refId: 'demo.topic.introductions', title: '认识彼此', visitedAt: '2026-10-01T00:00:00Z' }]);
  assert.deepEqual(store.snapshot().frameworkProgress, emptyProgress());
  store.close();
  const check = new DatabaseSync(path);
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 3);
  check.close();
});

test('目录修订新增细分项时保留旧覆盖、自评来源与设置，不覆盖历史内容', () => {
  const path = databasePath();
  let store = new LocalStore(path);
  store.close();
  const db = new DatabaseSync(path);
  const unit = framework.boards[0].units[0];
  const stamp = '2026-10-01T00:00:00Z';
  db.prepare('INSERT INTO learning_coverage VALUES (?, ?, ?, ?, ?)').run(framework.catalog_id, unit.id, 'studied', JSON.stringify(unit.outline.map(item => item.id)), stamp);
  db.prepare('INSERT INTO ability_progress VALUES (?, ?, ?, ?, ?, ?, ?)').run(framework.catalog_id, ability.tree.children[0].children[0].id, 'self_reported', 'self', '[]', 'TEST FIXTURE：用户自评，非系统评估', stamp);
  db.close();
  store = new LocalStore(path);
  const before = store.snapshot();
  const updated = structuredClone(framework);
  const updatedTree = structuredClone(ability);
  // Synthetic import fixture only; never added to shipped teaching content.
  updated.boards[0].units[0].outline.push({ id: 'A1-B01-U01-P05', text: 'TEST ONLY：增量结构验证' });
  updated.counts.outline_item_count++;
  updatedTree.tree.children[0].children[0].outline_refs.push('A1-B01-U01-P05');
  const imported = store.importScaffold(updated, updatedTree);
  assert.equal(imported.alreadyImported, false);
  assert.deepEqual(store.snapshot(), before);
  assert.equal(coverageFor(updated.boards[0].units[0], before.frameworkProgress).status, 'partially_covered');
  assert.equal(applicationFor(ability.tree.children[0].children[0].id, before.frameworkProgress).status, 'self_reported');
  assert.equal(store.importScaffold(updated, updatedTree).alreadyImported, true);
  store.close();
  const check = new DatabaseSync(path);
  assert.equal(check.prepare('SELECT count(*) AS n FROM framework_catalogs').get().n, 1);
  assert.equal(check.prepare('SELECT count(*) AS n FROM framework_revisions').get().n, 2);
  assert.equal(check.prepare('SELECT count(*) AS n FROM learning_coverage').get().n, 1);
  assert.equal(check.prepare('SELECT count(*) AS n FROM ability_progress').get().n, 1);
  check.close();
});

test('无效数量、重复 ID、断开的能力引用在写入之前拒绝', () => {
  const path = databasePath();
  const store = new LocalStore(path);
  const initial = store.snapshot();
  const duplicate = structuredClone(framework);
  duplicate.boards[0].units[1].outline[0].id = duplicate.boards[0].units[0].outline[0].id;
  assert.throws(() => store.importScaffold(duplicate, ability), /重复 ID/);
  const badCounts = structuredClone(framework);
  badCounts.counts.outline_item_count--;
  assert.throws(() => store.importScaffold(badCounts, ability), /数量/);
  const badRefs = structuredClone(ability);
  badRefs.tree.children[0].children[0].source_catalog_id = 'missing-topic';
  assert.throws(() => store.importScaffold(framework, badRefs), /引用/);
  const leaves = structuredClone(ability);
  leaves.tree.children[0].children[0].skill_leaf_ids.push('invented-leaf');
  assert.throws(() => validateScaffold(framework, leaves), /能力叶片/);
  assert.deepEqual(store.snapshot(), initial);
  store.close();
  const db = new DatabaseSync(path);
  assert.equal(db.prepare('SELECT count(*) AS n FROM framework_revisions').get().n, 1);
  db.close();
});

test('学习覆盖与能力状态独立：未评估不会显示掌握，无来源或无证据不升级', () => {
  const unit = framework.boards[0].units[0];
  const node = ability.tree.children[0].children[0];
  const progress = emptyProgress();
  assert.equal(coverageFor(unit, progress).label, '未开始');
  assert.equal(applicationFor(node.id, progress).label, '未评估');
  progress.learning[unit.id] = { unitId: unit.id, status: 'studied', coveredOutlineIds: unit.outline.map(item => item.id), updatedAt: 'test' };
  assert.equal(coverageFor(unit, progress).label, '已学习');
  assert.equal(applicationFor(node.id, progress).label, '未评估');
  progress.application[node.id] = { nodeId: node.id, status: 'self_reported', source: 'none', evidenceIds: [], note: null, updatedAt: 'test' };
  assert.equal(applicationFor(node.id, progress).label, '未评估');
  progress.application[node.id] = { ...progress.application[node.id], status: 'evidence_supported', source: 'assessment' };
  assert.equal(applicationFor(node.id, progress).label, '未评估');
});
