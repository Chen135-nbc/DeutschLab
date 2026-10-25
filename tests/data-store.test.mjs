import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { LocalStore } = require('../dist/main/store.cjs');
const data = JSON.parse(readFileSync(new URL('../content/demo/catalog.json', import.meta.url), 'utf8'));
const tempDatabase = () => join(mkdtempSync(join(tmpdir(), 'deutschlab-store-')), 'profile.sqlite');

test('演示内容身份唯一，关系有效，两个单元和专题复用一个副本', () => {
  assert.equal(data.isDemo, true);
  assert.equal(data.units.length, 2);
  assert.equal(data.topics.length, 2);
  assert.equal(data.quests.length, 1);
  const all = [...data.units, ...data.topics, ...data.quests, ...data.knowledge, ...data.skills];
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
  assert.ok(all.every(item => item.id.startsWith('demo.')));
  const groups = { unitIds: data.units, topicIds: data.topics, questIds: data.quests, knowledgeIds: data.knowledge };
  for (const item of all) {
    for (const [key, targets] of Object.entries(groups)) {
      for (const id of item[key] ?? []) assert.ok(targets.some(target => target.id === id), `${item.id} -> ${id}`);
    }
  }
  for (const item of [...data.units, ...data.topics]) assert.deepEqual(item.questIds, [data.quests[0].id]);
});

test('设置和追加的浏览记录在数据库关闭重开后保留', () => {
  const path = tempDatabase();
  const store = new LocalStore(path);
  assert.equal(store.snapshot().settings.level, 'A1');
  const settings = { level: 'A2', fontSize: 'large', reducedMotion: true };
  store.updateSettings(settings);
  store.recordVisit({ kind: 'course', refId: data.units[0].id });
  store.recordVisit({ kind: 'course', refId: data.units[0].id });
  const before = store.snapshot();
  assert.equal(before.visits.length, 2);
  assert.notEqual(before.visits[0].id, before.visits[1].id);
  assert.ok(before.visits.every(v => v.title === data.units[0].title && !('score' in v)));
  store.close();
  const reopened = new LocalStore(path);
  assert.deepEqual(reopened.snapshot(), before);
  assert.deepEqual(reopened.snapshot().settings, settings);
  reopened.close();
});

test('无效设置、无效引用不能覆盖现有档案', () => {
  const store = new LocalStore(tempDatabase());
  const before = store.snapshot();
  for (const invalid of [null, { level: 'C9', fontSize: 'standard', reducedMotion: false }, { level: 'A1', fontSize: 'huge', reducedMotion: false }, { level: 'A1', fontSize: 'large', reducedMotion: true, filePath: '/tmp/a' }]) {
    assert.throws(() => store.updateSettings(invalid));
  }
  assert.throws(() => store.recordVisit({ kind: 'course', refId: 'unknown' }));
  assert.throws(() => store.recordVisit({ kind: 'score', refId: data.units[0].id }));
  assert.deepEqual(store.snapshot(), before);
  store.close();
});

test('新增预设与自定义字号持久化，非法字号不会覆盖已保存的设置', () => {
  const path = tempDatabase();
  const store = new LocalStore(path);
  const settings = { level: 'A2', fontSize: 'standard', reducedMotion: true };
  for (const fontSize of ['small', 'standard', 'large', 'extra-large', 'largest', 12, 19, 24]) {
    store.updateSettings({ ...settings, fontSize });
    assert.equal(store.snapshot().settings.fontSize, fontSize);
  }
  const before = store.snapshot();
  for (const fontSize of [11, 25, 14.5, NaN, Infinity, '19', null, {}, []]) {
    assert.throws(() => store.updateSettings({ ...settings, fontSize }));
    assert.deepEqual(store.snapshot(), before);
  }
  store.close();
  const reopened = new LocalStore(path);
  assert.deepEqual(reopened.snapshot(), before);
  reopened.close();
});

test('不会将较新数据库格式降级或自动重置', () => {
  const path = tempDatabase();
  const db = new DatabaseSync(path);
  db.exec('PRAGMA user_version = 9; CREATE TABLE future_data (message TEXT); INSERT INTO future_data VALUES (\'keep\');');
  db.close();
  assert.throws(() => new LocalStore(path), /较新版本/);
  const reopened = new DatabaseSync(path);
  assert.equal(reopened.prepare('PRAGMA user_version').get().user_version, 9);
  assert.equal(reopened.prepare('SELECT message FROM future_data').get().message, 'keep');
  reopened.close();
});
