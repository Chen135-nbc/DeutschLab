import rawPack from '../../content/studio21/a1/lektion1.json';
import { a1Scaffold } from './framework';

export type QuestionType = 'single' | 'match' | 'fill' | 'order';
export type Answer = string | string[];
export interface Choice { id: string; text: string }
export interface KnowledgeCard {
  id: string; unitId: string; sectionId: string; level: string; title: string;
  category: '交际知识' | '主题词汇' | '语法知识' | '常用表达' | '发音知识';
  learningStatus: 'new' | 'reinforce' | 'recognition'; core: string[];
  explanation: string; example: string; exampleSource: string; relatedIds: string[]; sourcePages: string;
}
export interface PracticeQuestion {
  id: string; sectionId: string; knowledgeId: string; type: QuestionType; difficulty: 1 | 2 | 3;
  prompt: string; explanation: string; answer: Answer;
  options?: Choice[]; left?: Choice[]; right?: Choice[]; tokens?: Choice[];
  acceptedAnswers?: string[]; hint?: string; gradingRule?: string;
}
export interface Section {
  id: string; title: string; pages: string; summary: string;
  cardIds: string[]; exerciseIds: string[]; frameworkLinks: string[];
}
export interface StudioPack {
  packId: string; packVersion: string; schemaVersion: number;
  source: { kind: string; textbook: string; pages: string; note: string };
  unit: { id: string; level: string; number: string; title: string; chineseTitle: string;
    pages: string; teachingPages: string; practicePages: string; reviewPage: string;
    sections: Section[]; assessmentIds: string[] };
  cards: KnowledgeCard[]; questions: PracticeQuestion[];
}
function ensure(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`Studio21 内容包无效：${message}`); }
function ids(items: { id: string }[], label: string) {
  const set = new Set(items.map(item => item.id));
  ensure(items.every(item => typeof item.id === 'string' && !!item.id), `${label}缺少 ID`);
  ensure(set.size === items.length, `${label}存在重复 ID`);
  return set;
}
export function normalizeFill(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
}
export function validateStudioPack(input: unknown, sharedCards: readonly KnowledgeCard[] = []): StudioPack {
  const value = input as StudioPack;
  ensure(value?.schemaVersion === 1 && !!value.unit?.id && !!value.packId, '格式或单元 ID 错误');
  ensure(value.unit.level === 'A1' && Array.isArray(value.unit.sections) && Array.isArray(value.cards) && Array.isArray(value.questions), '缺少课程数据');
  const sectionIds = ids(value.unit.sections, '小节');
  const cardIds = ids(value.cards, '知识卡');
  const sharedIds = ids([...sharedCards], '共享知识卡');
  ensure(value.cards.every(card => !sharedIds.has(card.id)), '不能在新单元复制已有知识卡 ID');
  const availableCardIds = new Set([...cardIds, ...sharedIds]);
  const questionIds = ids(value.questions, '题目');
  ensure(sectionIds.size > 0 && cardIds.size > 0 && questionIds.size > 0, '不能是空课程');
  for (const section of value.unit.sections) {
    ensure(!!section.title && !!section.pages && section.cardIds.length > 0 && section.exerciseIds.length > 0, `小节缺少内容：${section.id}`);
    ensure(section.cardIds.every(id => availableCardIds.has(id)) && section.exerciseIds.every(id => questionIds.has(id)), `小节引用无效：${section.id}`);
    ensure(section.frameworkLinks.every(id => a1Scaffold.unitById.has(id)), `拓展专题 ID 无效：${section.id}`);
  }
  for (const card of value.cards) {
    ensure(card.unitId === value.unit.id && sectionIds.has(card.sectionId), `知识卡所属无效：${card.id}`);
    ensure(!!card.title && !!card.explanation && !!card.example && !!card.sourcePages && card.core.length > 0, `知识卡内容不完整：${card.id}`);
    ensure(card.relatedIds.every(id => availableCardIds.has(id)), `知识卡关联无效：${card.id}`);
    ensure(value.unit.sections.find(section => section.id === card.sectionId)?.cardIds.includes(card.id), `知识卡未列入小节：${card.id}`);
  }
  for (const question of value.questions) {
    ensure([1, 2, 3].includes(question.difficulty), `题目难度无效：${question.id}`);
    ensure(availableCardIds.has(question.knowledgeId) && !!question.prompt && !!question.explanation, `题目缺少知识点或解析：${question.id}`);
    ensure(question.sectionId === 'assessment' ? value.unit.assessmentIds.includes(question.id) : !!value.unit.sections.find(section => section.id === question.sectionId)?.exerciseIds.includes(question.id), `题目未列入练习：${question.id}`);
    if (question.type === 'single') {
      ensure(Array.isArray(question.options) && question.options.length >= 2 && ids(question.options, '选项').has(question.answer as string), `单选答案无效：${question.id}`);
    } else if (question.type === 'fill') {
      ensure(Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0 && question.gradingRule === 'trim-collapse-whitespace-casefold-preserve-umlauts-v1', `填空规则无效：${question.id}`);
      ensure(question.acceptedAnswers.includes(question.answer as string), `填空参考答案无效：${question.id}`);
      ensure(new Set(question.acceptedAnswers.map(normalizeFill)).size === question.acceptedAnswers.length, `填空接受答案重复：${question.id}`);
    } else if (question.type === 'match') {
      ensure(Array.isArray(question.left) && Array.isArray(question.right) && Array.isArray(question.answer), `匹配题结构无效：${question.id}`);
      ensure(question.left.length >= 2 && question.left.length === question.right.length && question.answer.length === question.left.length, `匹配题数量无效：${question.id}`);
      ensure(ids(question.right, '匹配选项').size === question.right.length && ids(question.left, '匹配左项').size === question.left.length, `匹配项无效：${question.id}`);
      ensure(new Set(question.answer).size === question.right.length && question.answer.every(id => question.right!.some(item => item.id === id)), `匹配答案无效：${question.id}`);
    } else if (question.type === 'order') {
      ensure(Array.isArray(question.tokens) && Array.isArray(question.answer) && question.tokens.length >= 2, `排序题结构无效：${question.id}`);
      ensure(question.answer.length === question.tokens.length && new Set(question.answer).size === question.tokens.length && question.answer.every(id => question.tokens!.some(item => item.id === id)), `排序答案无效：${question.id}`);
    } else ensure(false, `未知题型：${question.id}`);
  }
  ensure(value.unit.assessmentIds.length >= 15 && value.unit.assessmentIds.length <= 20 && value.unit.assessmentIds.every(id => questionIds.has(id)), '综合检测应有 15–20 题');
  return value;
}
export const studioPack = validateStudioPack(rawPack as unknown as StudioPack);
export const studioUnit = studioPack.unit;
export const getStudioSection = (id: string) => studioUnit.sections.find(section => section.id === id);
export const getKnowledgeCard = (id: string) => studioPack.cards.find(card => card.id === id);
export const getPracticeQuestion = (id: string) => studioPack.questions.find(question => question.id === id);
export const questionsForScope = (scope: string, pack: StudioPack = studioPack) =>
  (scope === 'assessment' ? pack.unit.assessmentIds : pack.unit.sections.find(section => section.id === scope)?.exerciseIds ?? [])
    .map(id => pack.questions.find(question => question.id === id)!);
export type PracticeMode = 'basic' | 'advanced' | 'review';
export function parsePracticeScope(scope: string): { sectionId: string; mode: PracticeMode | null } {
  const match = /^(.*)--(basic|advanced|review)$/.exec(scope);
  return match ? { sectionId: match[1], mode: match[2] as PracticeMode } : { sectionId: scope, mode: null };
}
export function selectPracticeQuestions(scope: string, wrongKnowledgeIds: readonly string[], seed: string, wrongQuestionIds: readonly string[] = [], pack: StudioPack = studioPack): PracticeQuestion[] {
  const { sectionId, mode } = parsePracticeScope(scope);
  const pool = questionsForScope(sectionId, pack);
  if (!mode || sectionId === 'assessment') return pool;
  const wrong = new Set(wrongKnowledgeIds);
  const repeated = new Set(wrongQuestionIds);
  const hash = (id: string) => { let n = 2166136261; for (const char of `${seed}:${id}`) n = Math.imul(n ^ char.charCodeAt(0), 16777619); return n >>> 0; };
  const weight = (q: PracticeQuestion) => mode === 'basic' ? (q.difficulty <= 2 ? 2 : 0) : mode === 'advanced' ? (q.difficulty >= 2 ? 2 : 0) : (wrong.has(q.knowledgeId) ? repeated.has(q.id) ? 3 : 5 : q.difficulty >= 2 ? 1 : 0);
  const sorted = [...pool].sort((a, b) => weight(b) - weight(a) || hash(a.id) - hash(b.id));
  const selected = sorted.slice(0, Math.min(12, pool.length));
  return selected.sort((a, b) => hash(`order:${a.id}`) - hash(`order:${b.id}`));
}
export function gradeQuestion(question: PracticeQuestion, response: Answer): boolean {
  if (question.type === 'single') return typeof response === 'string' && response === question.answer;
  if (question.type === 'fill') return typeof response === 'string' && (question.acceptedAnswers ?? []).some(answer => normalizeFill(response) === normalizeFill(answer));
  return Array.isArray(response) && Array.isArray(question.answer) && response.length === question.answer.length && response.every((id, index) => id === (question.answer as string[])[index]);
}
export function correctAnswerText(question: PracticeQuestion): string {
  if (question.type === 'single') return question.options!.find(option => option.id === question.answer)?.text ?? '';
  if (question.type === 'fill') return question.acceptedAnswers!.join(' / ');
  if (question.type === 'order') return (question.answer as string[]).map(id => question.tokens!.find(token => token.id === id)!.text).join(' ');
  return question.left!.map((left, index) => `${left.text} → ${question.right!.find(right => right.id === (question.answer as string[])[index])!.text}`).join('；');
}
