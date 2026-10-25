import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { LocalStore } = require('../dist/main/store.cjs');
const { startPack, studioPack, studioA1Catalog, classroomInstructions, validateStudioPack, gradeQuestion, correctAnswerText, getKnowledgeCard, selectPracticeQuestions } = require('../dist/domain/studio21.cjs');
const file = () => join(mkdtempSync(join(tmpdir(), 'deutschlab-start-')), 'profile.sqlite');
const wrongFor = q => q.type === 'single' ? q.options.find(option => option.id !== q.answer).id : q.type === 'fill' ? 'unpassend' : [...q.answer].reverse();

test('Start 处于 A1 17 节点目录首位，四节页码与目标完整，未开放新拓展', () => {
  assert.equal(studioA1Catalog.nodes.length, 17);
  assert.deepEqual(studioA1Catalog.nodes.slice(0, 2).map(node => node.id), [startPack.unit.id, studioPack.unit.id]);
  assert.equal(studioA1Catalog.nodes.filter(node => node.kind === 'lesson').length, 12);
  assert.equal(studioA1Catalog.nodes.filter(node => node.kind === 'station').length, 4);
  assert.deepEqual(startPack.unit.sections.map(section => section.title), ['Deutsch sehen und hören', 'Im Deutschkurs', 'Das Alphabet', 'Internationale Wörter']);
  assert.deepEqual(startPack.unit.sections.map(section => section.pages), ['8–9', '10–11', '12–13', '14–15']);
  assert.deepEqual(startPack.unit.sections.map(section => section.exerciseIds.length), [12, 18, 16, 13]);
  assert.equal(startPack.unit.assessmentIds.length, 15);
  assert.equal(startPack.cards.length, 19);
  assert.deepEqual([...new Set(startPack.cards.map(card => card.learningStatus))].sort(), ['exposure', 'new', 'recognition']);
  assert.equal(startPack.questions.length, 74);
  assert.ok(startPack.unit.intro.includes('Einstieg'));
  assert.ok(startPack.unit.sections.every(section => section.guide.goals.length >= 3 && section.guide.tasks.length >= 2 && section.guide.wrapUp && section.frameworkLinks.length === 0));
  assert.equal(validateStudioPack(structuredClone(startPack), studioPack.cards).unit.id, startPack.unit.id);
  assert.ok(startPack.cards.some(card => card.relatedIds.includes('studio21.a1.lektion1.card.greeting')));
  for (const card of startPack.cards) {
    assert.ok(card.details.length && card.core.length && card.explanation.length > 20, card.id);
    assert.ok(card.relatedIds.every(id => getKnowledgeCard(id)), card.id);
  }
});

test('字母表、教材指令与来源说明完整；无音频题冒充听力评估', () => {
  assert.equal(startPack.alphabet.length, 26);
  assert.deepEqual(startPack.alphabet.map(item => item.letter), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  for (const [letter, ipa] of [['J', 'jɔt'], ['V', 'faʊ̯'], ['W', 'veː'], ['Z', 'tsɛt']]) assert.equal(startPack.alphabet.find(item => item.letter === letter).ipa, ipa);
  assert.equal(classroomInstructions.items.length, 8);
  assert.equal(new Set(classroomInstructions.items.map(item => item.id)).size, 8);
  assert.ok(classroomInstructions.sourceNote.includes('未对照'));
  assert.ok(startPack.source.note.includes('未取得教材原页及音频'));
  assert.ok(startPack.questions.every(question => !/听到录音后|根据录音选择/.test(question.prompt)));
});

test('74 道原创题均有唯一 ID、知识点和解释；正确答案判对，明显错误判错', () => {
  assert.equal(new Set(startPack.questions.map(question => question.id)).size, 74);
  assert.equal(new Set(startPack.questions.map(question => question.prompt)).size, 74);
  for (const q of startPack.questions) {
    assert.equal(gradeQuestion(q, q.answer), true, q.id);
    assert.equal(gradeQuestion(q, wrongFor(q)), false, q.id);
    assert.ok(correctAnswerText(q), q.id);
    assert.ok(q.explanation.length >= 12 && [1, 2, 3].includes(q.difficulty), q.id);
    assert.ok(startPack.cards.some(card => card.id === q.knowledgeId), q.id);
    if (q.type === 'single') assert.equal(new Set(q.options.map(option => option.text)).size, q.options.length, q.id);
  }
  for (const section of startPack.unit.sections) {
    const basic = selectPracticeQuestions(`${section.id}--basic`, [], 'fixed-seed', [], startPack);
    assert.equal(basic.length, Math.min(12, section.exerciseIds.length));
    assert.deepEqual(selectPracticeQuestions(`${section.id}--basic`, [], 'fixed-seed', [], startPack), basic);
  }
});

test('Start 记录独立持久化，综合检测至少 80% 标记基础学习；Lektion 1 和能力树不变', () => {
  const path = file();
  let store = new LocalStore(path);
  const firstCard = startPack.cards[0].id;
  const l1Card = studioPack.cards[0].id;
  store.setMaterialStatus('textbookDone', true);
  store.viewKnowledgeCard(l1Card);
  const originalL1 = store.snapshot().courseProgress;
  const originalFramework = store.snapshot().frameworkProgress;
  store.setMaterialStatus('recordingDone', true, startPack.unit.id);
  store.viewKnowledgeCard(firstCard);
  assert.deepEqual(store.snapshot().courseProgress, originalL1);
  assert.equal(store.snapshot().startProgress.viewedCardIds[0], firstCard);
  assert.equal(store.snapshot().startProgress.recordingDone, true);
  assert.equal(store.snapshot().startProgress.basicCompleted, false);
  store.startPractice('im-deutschkurs--basic', false, startPack.unit.id);
  const sectionRun = store.snapshot().startProgress.sessions[0];
  const firstQ = startPack.questions.find(q => q.id === sectionRun.questionIds[0]);
  store.submitAnswer(sectionRun.id, firstQ.id, firstQ.answer, false, true);
  store.close();
  store = new LocalStore(path);
  assert.equal(store.snapshot().startProgress.sessions[0].id, sectionRun.id);
  assert.equal(store.snapshot().startProgress.attempts[0].correct, true);
  assert.deepEqual(store.snapshot().courseProgress, originalL1);
  assert.deepEqual(store.snapshot().frameworkProgress, originalFramework);
  store.startPractice('assessment', false, startPack.unit.id);
  const assessment = store.snapshot().startProgress.sessions[0];
  assert.equal(assessment.questionIds.length, 15);
  for (const [index, id] of assessment.questionIds.entries()) {
    const q = startPack.questions.find(item => item.id === id);
    store.submitAnswer(assessment.id, q.id, index < 12 ? q.answer : wrongFor(q), false, false);
  }
  store.completePractice(assessment.id);
  const after = store.snapshot();
  assert.equal(after.startProgress.basicCompleted, true);
  assert.equal(after.startProgress.attempts.filter(item => item.sessionId === assessment.id && item.correct).length, 12);
  assert.deepEqual(after.courseProgress, originalL1);
  assert.deepEqual(after.frameworkProgress, originalFramework);
  const revised = structuredClone(startPack);
  revised.packVersion = '1.0.1-test';
  revised.cards[0].explanation += '（内容修订测试）';
  store.importStudioPack(revised);
  assert.equal(store.snapshot().startProgress.attempts.length, 16);
  assert.equal(store.snapshot().startProgress.basicCompleted, true);
  store.close();
  store = new LocalStore(path);
  assert.equal(store.snapshot().startProgress.basicCompleted, true);
  assert.deepEqual(store.snapshot().courseProgress, originalL1);
  store.close();
  const db = new DatabaseSync(path);
  assert.equal(db.prepare('SELECT count(*) AS n FROM course_content_active').get().n, 2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM practice_attempts a JOIN practice_sessions s ON s.id=a.session_id WHERE s.unit_id=?').get(startPack.unit.id).n, 16);
  db.close();
});
