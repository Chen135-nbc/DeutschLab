import data from '../../content/demo/catalog.json';
import { getFrameworkUnit } from './framework';
import { studioUnit } from './studio21';

// UI reads content from one data source; no page owns a copy of a quest.
export const catalog = data;
export type CourseUnit = typeof data.units[number];
export type Topic = typeof data.topics[number];
export type Quest = typeof data.quests[number];
export const getUnit = (id: string) => catalog.units.find(unit => unit.id === id);
export const getTopic = (id: string) => catalog.topics.find(topic => topic.id === id);
export const getQuest = (id: string) => catalog.quests.find(quest => quest.id === id);
export function resolveVisit(kind: string, id: string): string | undefined {
  if (kind === 'course') return id === studioUnit.id ? `${studioUnit.number}: ${studioUnit.title}` : getUnit(id)?.title;
  if (kind === 'topic') return getFrameworkUnit(id)?.title ?? getTopic(id)?.title;
  if (kind === 'quest') return getQuest(id)?.title;
}
