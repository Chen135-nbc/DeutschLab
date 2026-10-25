import numbersRaw from '../../content/extensions/a1/numbers.json';
import drinksRaw from '../../content/extensions/a1/drinks.json';
import { a1Scaffold } from './framework';
import { getKnowledgeCard, gradeQuestion, studioUnit, type PracticeQuestion, type Answer } from './studio21';

export interface ExtensionCard { id: string; outlineId: string; title: string; body: string[]; example: string; studioCardIds: string[] }
export interface VocabularyItem { id: string; term: string; meaning: string; article?: string; plural?: string; collocation: string; example: string; tags: string[] }
export interface ProductionPrompt { id: string; outlineId: string; knowledgeId: string; level: 1 | 2 | 3; task: string; hints: string[]; reference: string; checks: string[]; commonError: string }
export interface ExtensionPack {
  topicId: string; version: string; intro: string; goals: string[]; completion: string; studioCardIds: string[];
  sections: { outlineId: string; title: string; summary: string; cardIds: string[] }[];
  cards: ExtensionCard[]; vocabulary: VocabularyItem[]; questions: PracticeQuestion[]; production: ProductionPrompt[];
  tasks: { id: string; title: string; instruction: string; itemIds: string[] }[];
  numberSeeds?: number[];
}
const ones = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const teens = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
export function numberToGerman(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 1000) throw new Error('数字只支持 0–1000。');
  if (value === 1000) return 'eintausend';
  if (value >= 100) return `${value < 200 ? 'ein' : ones[Math.floor(value / 100)]}hundert${value % 100 ? numberToGerman(value % 100) : ''}`;
  if (value < 10) return ones[value];
  if (value < 20) return teens[value - 10];
  const unit = value % 10;
  return unit ? `${unit === 1 ? 'ein' : ones[unit]}und${tens[Math.floor(value / 10)]}` : tens[Math.floor(value / 10)];
}
const reverseNumbers = new Map(Array.from({ length: 1001 }, (_, index) => [numberToGerman(index), index]));
export function parseGermanNumber(text: string): number | null {
  return reverseNumbers.get(text.normalize('NFC').trim().toLocaleLowerCase('de')) ?? null;
}
function numberVariants(pack: ExtensionPack): PracticeQuestion[] {
  return (pack.numberSeeds ?? []).map((number, index) => {
    const alternatives = [number + 10 <= 1000 ? number + 10 : number - 10, number - 1, number + 1];
    const values = [number, ...alternatives];
    const options = values.map((value, choice) => ({ id: String(choice), text: numberToGerman(value) }));
    const shifted = [...options.slice(index % 4), ...options.slice(0, index % 4)];
    return { id: `ext.a1.numbers.q.generated-${number}`, sectionId: index < 6 ? 'A1-B03-U01-P03' : 'A1-B03-U01-P01',
      knowledgeId: index < 6 ? 'ext.a1.numbers.card.order' : 'ext.a1.numbers.card.large', difficulty: index < 2 ? 1 : 2,
      type: 'single', prompt: `数字 ${number} 的德语写法是哪项？`, answer: '0', options: shifted,
      explanation: `${number} = ${numberToGerman(number)}。先看百位，再核对个位与十位。` };
  });
}
export function validateExtensionPack(raw: unknown): ExtensionPack {
  const pack = structuredClone(raw) as ExtensionPack;
  const unit = a1Scaffold.unitById.get(pack?.topicId);
  if (!unit || !['A1-B03-U01', 'A1-B06-U04'].includes(pack.topicId)) throw new Error('拓展专题 ID 无效。');
  if (pack.sections.length !== unit.outline.length || pack.sections.some((section, i) => section.outlineId !== unit.outline[i].id)) throw new Error('拓展细分结构与原框架不一致。');
  if (pack.topicId === 'A1-B03-U01') {
    if (!pack.numberSeeds || new Set(pack.numberSeeds).size !== pack.numberSeeds.length || pack.numberSeeds.some(n => !Number.isInteger(n) || n < 0 || n > 1000)) throw new Error('数字变式种子无效。');
    for (const variant of numberVariants(pack)) {
      const existing = pack.questions.find(item => item.id === variant.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(variant)) throw new Error('数字变式内容与规则不一致。');
      if (!existing) pack.questions.push(variant);
    }
  }
  const all = [...pack.cards, ...pack.vocabulary, ...pack.questions, ...pack.production, ...pack.tasks];
  if (new Set(all.map(item => item.id)).size !== all.length) throw new Error('拓展内容 ID 重复。');
  const cards = new Set(pack.cards.map(item => item.id));
  const outlineIds = new Set(unit.outline.map(item => item.id));
  if (pack.studioCardIds.some(id => !getKnowledgeCard(id)) || pack.cards.some(card => !outlineIds.has(card.outlineId) || !card.title || !card.example || !card.body.length || card.studioCardIds.some(id => !getKnowledgeCard(id)))) throw new Error('拓展知识卡引用无效。');
  if (pack.sections.some(section => !section.cardIds.length || section.cardIds.some(id => !cards.has(id)))) throw new Error('细分知识卡不完整。');
  if (pack.questions.some(q => !outlineIds.has(q.sectionId) || !cards.has(q.knowledgeId) || ![1, 2, 3].includes(q.difficulty) || !gradeQuestion(q, q.answer))) throw new Error('拓展客观题无效。');
  if (pack.production.some(q => !outlineIds.has(q.outlineId) || !cards.has(q.knowledgeId) || !q.reference || !q.checks.length || !q.commonError)) throw new Error('拓展造句题无效。');
  if (pack.vocabulary.some(item => !item.term || !item.meaning || !item.collocation || !item.example || !item.tags.length)) throw new Error('词汇条目不完整。');
  if (pack.tasks.some(task => !task.itemIds.length || task.itemIds.some(id => !pack.production.some(item => item.id === id)))) throw new Error('小任务引用无效。');
  return pack;
}
export const extensionPacks = [validateExtensionPack(numbersRaw), validateExtensionPack(drinksRaw)];
export const getExtensionPack = (topicId: string) => extensionPacks.find(pack => pack.topicId === topicId);
export const extensionItem = (pack: ExtensionPack, id: string) => pack.questions.find(item => item.id === id) ?? pack.production.find(item => item.id === id);
export const extensionIsProduction = (item: PracticeQuestion | ProductionPrompt): item is ProductionPrompt => 'task' in item;
export function selectExtensionItems(pack: ExtensionPack, seed: string, wrongIds: readonly string[] = []): string[] {
  const hash = (id: string) => { let n = 2166136261; for (const char of `${seed}:${id}`) n = Math.imul(n ^ char.charCodeAt(0), 16777619); return n >>> 0; };
  const wrong = new Set(wrongIds);
  const objective = [...pack.questions].sort((a, b) => Number(wrong.has(b.knowledgeId)) - Number(wrong.has(a.knowledgeId)) || hash(a.id) - hash(b.id)).slice(0, Math.min(7, pack.questions.length));
  const production = [...pack.production].sort((a, b) => hash(a.id) - hash(b.id)).slice(0, 2);
  return [...objective.map(item => item.id), ...production.map(item => item.id)];
}
export function gradeExtensionObjective(question: PracticeQuestion, response: Answer): boolean { return gradeQuestion(question, response); }
export const linkedStudioUnitId = studioUnit.id;
