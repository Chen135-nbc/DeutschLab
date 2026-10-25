import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { LocalStore } = require('../dist/main/store.cjs');
const { studioPack, validateStudioPack, gradeQuestion, correctAnswerText } = require('../dist/domain/studio21.cjs');
const freshPath = () => join(mkdtempSync(join(tmpdir(), 'deutschlab-studio-')), 'profile.sqlite');

test('Studio21 第一单元的章节、知识卡、题目和实际专题 ID 完整可用', () => {
  assert.equal(studioPack.unit.title, 'Kaffee oder Tee?');
  assert.equal(studioPack.unit.sections.length, 4);
  assert.deepEqual(studioPack.unit.sections.map(section => section.pages), ['16–17', '18–19', '20–21', '22–23']);
  assert.equal(studioPack.cards.length, 18);
  assert.equal(studioPack.questions.length, 27);
  assert.equal(studioPack.unit.assessmentIds.length, 9);
  assert.deepEqual(studioPack.unit.sections.map(section => section.exerciseIds.length), [4, 6, 4, 4]);
  assert.deepEqual(new Set(studioPack.questions.map(question => question.type)), new Set(['single', 'fill', 'match', 'order']));
  assert.ok(studioPack.unit.sections.every(section => section.frameworkLinks.every(id => /^A1-B\d\d-U\d\d$/.test(id))));
  assert.equal(validateStudioPack(structuredClone(studioPack)).unit.id, studioPack.unit.id);
});

test('27 道题每道参考答案均判对、错误答案均判错，填空保留德语拼写要求', () => {
  for (const question of studioPack.questions) {
    assert.equal(gradeQuestion(question, question.answer), true, question.id);
    assert.ok(correctAnswerText(question), question.id);
    const wrong = question.type === 'single' ? question.options.find(item => item.id !== question.answer).id
      : question.type === 'fill' ? 'xyz' : [...question.answer].reverse();
    assert.equal(gradeQuestion(question, wrong), false, question.id);
  }
  const fill = studioPack.questions.find(question => question.id.endsWith('s3-spell'));
  assert.equal(gradeQuestion(fill, '  FÜNFUND­DREISSIG  '), false);
  assert.equal(gradeQuestion(fill, '  FÜNFUNDDREIẞIG  '), true);
  assert.equal(gradeQuestion(fill, '  FÜNFUNDDREIßIG  '), true);
  assert.equal(gradeQuestion(fill, 'funfunddreißig'), false);
  const sein = studioPack.questions.find(question => question.id.endsWith('s2-sein'));
  assert.equal(gradeQuestion(sein, '  SIND  '), true);
  assert.equal(gradeQuestion(sein, 'sind '), true);
});

test('未来单元可按稳定 ID 引用第一单元的知识卡，无须复制卡片内容', () => {
  const second = JSON.parse(JSON.stringify(studioPack).replaceAll('studio21.a1.lektion1', 'studio21.a1.lektion2'));
  const sharedId = studioPack.cards[0].id;
  const duplicateId = second.cards[0].id;
  second.cards.shift();
  second.unit.sections[0].cardIds[0] = sharedId;
  for (const card of second.cards) card.relatedIds = card.relatedIds.map(id => id === duplicateId ? sharedId : id);
  for (const question of second.questions) if (question.knowledgeId === duplicateId) question.knowledgeId = sharedId;
  assert.throws(() => validateStudioPack(second), /小节引用无效/);
  assert.equal(validateStudioPack(second, studioPack.cards).unit.id, 'studio21.a1.lektion2');
  second.cards.push(studioPack.cards[0]);
  assert.throws(() => validateStudioPack(second, studioPack.cards), /复制已有知识卡/);
});

test('教材状态、知识卡浏览、答题及旧题快照可在关闭重开和内容更新后保留', () => {
  const path = freshPath();
  let store = new LocalStore(path);
  const initial = store.snapshot();
  assert.equal(initial.courseProgress.textbookDone, false);
  assert.equal(initial.courseProgress.recordingDone, false);
  assert.equal(initial.courseProgress.attempts.length, 0);
  const cardId = studioPack.unit.sections[0].cardIds[0];
  store.setMaterialStatus('recordingDone', true);
  store.viewKnowledgeCard(cardId);
  assert.deepEqual(store.snapshot().courseProgress.viewedCardIds, [cardId]);
  store.startPractice('im-cafe');
  store.viewKnowledgeCard(cardId, true);
  assert.equal(store.snapshot().courseProgress.lastLocation, '/focus/studio21/practice/im-cafe');
  const firstSession = store.snapshot().courseProgress.sessions[0].id;
  const firstQuestion = studioPack.questions.find(question => question.id === studioPack.unit.sections[0].exerciseIds[0]);
  const saved = store.submitAnswer(firstSession, firstQuestion.id, firstQuestion.answer, true, true).courseProgress.attempts[0];
  assert.equal(saved.correct, true);
  assert.equal(saved.hintViewed, true);
  assert.equal(saved.cardViewed, true);
  assert.ok(saved.questionSnapshot.includes(firstQuestion.prompt));
  assert.throws(() => store.submitAnswer(firstSession, firstQuestion.id, firstQuestion.answer, false, false));
  assert.throws(() => store.completePractice(firstSession), /尚未完成/);
  for (const id of studioPack.unit.sections[0].exerciseIds.slice(1)) {
    const question = studioPack.questions.find(item => item.id === id);
    store.submitAnswer(firstSession, id, question.answer, false, false);
  }
  store.completePractice(firstSession);
  assert.ok(store.snapshot().courseProgress.sessions[0].completedAt);
  assert.equal(store.snapshot().courseProgress.lastLocation, `/courses/${studioPack.unit.id}/sections/im-cafe`);
  store.startPractice('im-cafe', true);
  const secondSession = store.snapshot().courseProgress.sessions[0].id;
  assert.notEqual(secondSession, firstSession);
  const wrong = [...firstQuestion.answer].reverse();
  assert.throws(() => store.submitAnswer(secondSession, firstQuestion.id, [wrong[0], wrong[0]], false, false));
  store.submitAnswer(secondSession, firstQuestion.id, wrong, false, false);
  const before = store.snapshot();
  assert.equal(before.courseProgress.attempts.length, 5);
  assert.equal(before.courseProgress.attempts[0].correct, false);
  assert.equal(before.courseProgress.recordingDone, true);
  assert.equal(before.courseProgress.textbookDone, false);
  const revised = structuredClone(studioPack);
  revised.source.note += ' 修订内容来源说明。';
  assert.equal(store.importStudioPack(revised).alreadyImported, false);
  assert.equal(store.importStudioPack(revised).alreadyImported, true);
  assert.deepEqual(store.snapshot().courseProgress, before.courseProgress);
  store.close();
  store = new LocalStore(path);
  assert.deepEqual(store.snapshot().courseProgress, before.courseProgress);
  store.close();
  const db = new DatabaseSync(path);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3);
  assert.equal(db.prepare('SELECT count(*) AS n FROM course_content_revisions').get().n, 2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM practice_attempts').get().n, 5);
  db.close();
});
