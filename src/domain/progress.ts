import type { FrameworkUnit } from './framework';

export type LearningCoverageStatus = 'not_started' | 'partially_covered' | 'studied';
export type ApplicationStatus = 'not_assessed' | 'in_practice' | 'self_reported' | 'evidence_supported';
export interface LearningCoverageRecord {
  unitId: string;
  status: LearningCoverageStatus;
  coveredOutlineIds: string[];
  updatedAt: string;
}
export interface ApplicationRecord {
  nodeId: string;
  status: ApplicationStatus;
  source: 'none' | 'practice' | 'self' | 'assessment';
  evidenceIds: string[];
  note: string | null;
  updatedAt: string;
}
export interface FrameworkProgress {
  learning: Record<string, LearningCoverageRecord>;
  application: Record<string, ApplicationRecord>;
}
export const coverageLabels: Record<LearningCoverageStatus, string> = {
  not_started: '未开始', partially_covered: '部分覆盖', studied: '已学习',
};
export const applicationLabels: Record<ApplicationStatus, string> = {
  not_assessed: '未评估', in_practice: '练习中', self_reported: '自评掌握', evidence_supported: '有评估证据',
};
export function coverageFor(unit: FrameworkUnit, progress: FrameworkProgress) {
  const record = progress.learning[unit.id];
  const coveredIds = new Set((record?.coveredOutlineIds ?? []).filter(id => unit.outline.some(item => item.id === id)));
  let status: LearningCoverageStatus = 'not_started';
  if (record?.status === 'studied' && unit.outline.length > 0 && coveredIds.size === unit.outline.length) status = 'studied';
  else if (record && (coveredIds.size > 0 || record.status === 'partially_covered' || record.status === 'studied')) status = 'partially_covered';
  return { status, label: coverageLabels[status], coveredIds, total: unit.outline.length };
}
export function applicationFor(nodeId: string, progress: FrameworkProgress) {
  const record = progress.application[nodeId];
  let status: ApplicationStatus = 'not_assessed';
  if (record?.status === 'in_practice' && record.source === 'practice') status = 'in_practice';
  else if (record?.status === 'self_reported' && record.source === 'self') status = 'self_reported';
  else if (record?.status === 'evidence_supported' && record.source === 'assessment' && record.evidenceIds.length > 0) status = 'evidence_supported';
  return { status, label: applicationLabels[status], record: status === 'not_assessed' ? undefined : record };
}
