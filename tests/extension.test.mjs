import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { LocalStore } = require('../dist/main/store.cjs');
const { extensionPacks, numberToGerman, parseGermanNumber, selectExtensionItems, extensionItem, gradeExtensionObjective, validateExtensionPack } = require('../dist/domain/extension.cjs');
const { a1Scaffold } = require('../dist/domain/framework.cjs');
const path = () => join(mkdtempSync(join(tmpdir(), 'deutschlab-extension-')), 'profile.sqlite');

test('只在原有 3.1 和 6.4 节点挂载内容，纲要与能力树 ID 不变', () => {
  assert.deepEqual(extensionPacks.map(pack => pack.topicId), ['A1-B03-U01', 'A1-B06-U04']);
  for (const pack of extensionPacks) {
    const unit = a1Scaffold.unitById.get(pack.topicId);
    assert.deepEqual(pack.sections.map(section => section.outlineId), unit.outline.map(item => item.id));
    assert.equal(a1Scaffold.nodeByUnitId.get(pack.topicId).source_catalog_id, unit.id);
    assert.ok(pack.goals.length >= 4);
    assert.ok(pack.cards.length >= 7);
    assert.equal(pack.vocabulary.length, 12);
    assert.equal(pack.production.length, 6);
    assert.equal(pack.tasks.length, 2);
    assert.ok(pack.sections.every(section => section.cardIds.length));
    assert.ok(pack.tasks.every(task => task.itemIds.every(id => pack.production.some(item => item.id === id))));
    const ids = [...pack.cards, ...pack.vocabulary, ...pack.questions, ...pack.production, ...pack.tasks].map(item => item.id);
    assert.equal(ids.length, new Set(ids).size);
  }
  assert.equal(extensionPacks[0].questions.length, 22);
  assert.equal(extensionPacks[1].questions.length, 12);
  assert.equal(a1Scaffold.units.length, 68);
});

test('0—1000 德语数字生成与解析互逆，典型不规则写法正确', () => {
  const known = new Map([[0, 'null'], [16, 'sechzehn'], [17, 'siebzehn'], [21, 'einundzwanzig'], [30, 'dreißig'], [60, 'sechzig'], [70, 'siebzig'], [100, 'einhundert'], [105, 'einhundertfünf'], [342, 'dreihundertzweiundvierzig'], [999, 'neunhundertneunundneunzig'], [1000, 'eintausend']]);
  for (const [number, spelling] of known) assert.equal(numberToGerman(number), spelling);
  const words = new Set();
  for (let number = 0; number <= 1000; number++) {
    const word = numberToGerman(number);
    assert.equal(parseGermanNumber(word), number);
    words.add(word);
  }
  assert.equal(words.size, 1001);
  assert.equal(parseGermanNumber('  DREIßIG  '), 30);
  assert.equal(parseGermanNumber('dreißigg'), null);
  for (const invalid of [-1, 1001, 1.5]) assert.throws(() => numberToGerman(invalid));
});

test('全部客观题答案唯一、正确选项可判对，其他选项均判错；抽题可重复且优先错点', () => {
  for (const pack of extensionPacks) {
    for (const item of pack.questions) {
      assert.equal(item.type, 'single');
      assert.equal(item.options.length, 4);
      assert.equal(new Set(item.options.map(option => option.text)).size, 4, item.id);
      assert.ok(item.options.some(option => option.id === item.answer), item.id);
      assert.ok(item.explanation.length >= 8, item.id);
      for (const option of item.options) assert.equal(gradeExtensionObjective(item, option.id), option.id === item.answer, item.id);
    }
    const first = selectExtensionItems(pack, 'fixed-seed');
    assert.deepEqual(selectExtensionItems(pack, 'fixed-seed'), first);
    assert.equal(first.length, 9);
    assert.equal(new Set(first).size, first.length);
    assert.equal(first.filter(id => pack.production.some(item => item.id === id)).length, 2);
    const wrongCard = pack.questions.at(-1).knowledgeId;
    const prioritized = selectExtensionItems(pack, 'fixed-seed', [wrongCard]).slice(0, 7);
    assert.ok(prioritized.some(id => extensionItem(pack, id).knowledgeId === wrongCard));
  }
});

test('浏览、客观题和短句自核对追加保存；能力树只到练习中，未开发节点保持未开始', () => {
  const file = path();
  let store = new LocalStore(file);
  const numbers = extensionPacks[0];
  const drinks = extensionPacks[1];
  assert.deepEqual(store.snapshot().frameworkProgress, { learning: {}, application: {} });
  store.viewExtensionCard(numbers.topicId, numbers.cards[0].id);
  assert.equal(store.snapshot().frameworkProgress.learning[numbers.topicId].status, 'partially_covered');
  assert.equal(store.snapshot().extensionProgress.lastPositions[numbers.topicId], `/focus/extension/${numbers.topicId}/cards/${numbers.cards[0].id}`);
  store.startExtensionPractice(numbers.topicId);
  const session = store.snapshot().extensionProgress.sessions[0];
  assert.equal(session.itemIds.length, 9);
  assert.throws(() => store.submitExtensionAnswer(session.id, session.itemIds[0], 'invalid-option'), /有效答案/);
  assert.throws(() => store.completeExtensionPractice(session.id), /尚未完成/);
  for (const id of session.itemIds) {
    const item = extensionItem(numbers, id);
    if ('task' in item) {
      assert.throws(() => store.submitExtensionAnswer(session.id, id, item.reference), /自我核对/);
      store.submitExtensionAnswer(session.id, id, item.reference, 'needs_work');
    } else store.submitExtensionAnswer(session.id, id, item.answer);
  }
  store.completeExtensionPractice(session.id);
  const before = store.snapshot();
  assert.equal(before.extensionProgress.attempts.length, 9);
  assert.equal(before.extensionProgress.attempts.filter(item => item.correct === true).length, 7);
  assert.equal(before.extensionProgress.attempts.filter(item => item.selfCheck === 'needs_work').length, 2);
  assert.equal(before.frameworkProgress.application[a1Scaffold.nodeByUnitId.get(numbers.topicId).id].status, 'in_practice');
  assert.equal(before.frameworkProgress.learning[numbers.topicId].status, 'partially_covered');
  assert.equal(before.frameworkProgress.learning['A1-B01-U04'], undefined);
  for (const card of numbers.cards.slice(1)) store.viewExtensionCard(numbers.topicId, card.id);
  assert.equal(store.snapshot().frameworkProgress.learning[numbers.topicId].status, 'studied');
  store.startExtensionPractice(drinks.topicId, false, drinks.tasks[0].id);
  const task = store.snapshot().extensionProgress.sessions[0];
  assert.deepEqual(task.itemIds, drinks.tasks[0].itemIds);
  store.submitExtensionAnswer(task.id, task.itemIds[0], 'Ich trinke gern Tee.', 'can_do');
  const persisted = store.snapshot();
  store.close();
  store = new LocalStore(file);
  assert.deepEqual(store.snapshot().extensionProgress, persisted.extensionProgress);
  assert.deepEqual(store.snapshot().frameworkProgress, persisted.frameworkProgress);
  assert.equal(store.snapshot().extensionProgress.sessions.find(item => item.id === task.id).completedAt, null);
  store.startExtensionPractice(drinks.topicId, false, drinks.tasks[0].id);
  assert.equal(store.snapshot().extensionProgress.sessions[0].id, task.id);
  store.close();
  const db = new DatabaseSync(file);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 5);
  assert.equal(db.prepare('SELECT count(*) AS n FROM extension_content_active').get().n, 2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM extension_attempts').get().n, 10);
  db.close();
});

test('内容修订和坏引用不会覆盖历史作答；旧会话仍按旧题目快照判分', () => {
  const file = path();
  let store = new LocalStore(file);
  const pack = extensionPacks[1];
  assert.throws(() => validateExtensionPack({ ...pack, topicId: 'A1-B01-U04' }), /ID 无效/);
  assert.throws(() => validateExtensionPack({ ...pack, tasks: [{ ...pack.tasks[0], itemIds: ['missing'] }] }), /引用无效/);
  store.startExtensionPractice(pack.topicId);
  const session = store.snapshot().extensionProgress.sessions[0];
  const item = extensionItem(pack, session.itemIds[0]);
  store.submitExtensionAnswer(session.id, item.id, item.answer);
  const before = store.snapshot().extensionProgress.attempts[0];
  const revised = structuredClone(pack);
  revised.intro += ' 内容修订测试。';
  revised.questions.find(question => question.id === item.id).explanation += ' 历史题目应保留旧解释。';
  const newRevision = store.importExtensionPack(revised);
  assert.notEqual(newRevision, session.contentRevision);
  assert.deepEqual(store.snapshot().extensionProgress.attempts[0], before);
  assert.throws(() => store.importExtensionPack({ ...pack, tasks: [{ ...pack.tasks[0], itemIds: ['missing'] }] }), /引用无效/);
  const second = extensionItem(pack, session.itemIds[1]);
  store.submitExtensionAnswer(session.id, second.id, second.answer);
  assert.equal(JSON.parse(store.snapshot().extensionProgress.attempts[0].itemSnapshot).explanation, second.explanation);
  store.close();
  store = new LocalStore(file);
  assert.equal(store.snapshot().extensionProgress.attempts.length, 2);
  store.close();
  const db = new DatabaseSync(file);
  assert.equal(db.prepare('SELECT count(*) AS n FROM extension_content_revisions WHERE topic_id = ?').get(pack.topicId).n, 2);
  db.close();
});
