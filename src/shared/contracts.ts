import type { FrameworkProgress } from '../domain/progress';
import type { FontSize } from './typography';
import type { Answer } from '../domain/studio21';
export const levels = ['A1', 'A2', 'B1', 'B2'] as const;
export type Level = typeof levels[number];
export interface Settings {
  level: Level;
  fontSize: FontSize;
  reducedMotion: boolean;
}
export type VisitKind = 'course' | 'topic' | 'quest';
export interface VisitInput { kind: VisitKind; refId: string }
export interface Visit extends VisitInput { id: string; title: string; visitedAt: string }
export interface PracticeSession { id: string; scope: string; contentRevision: string; createdAt: string; completedAt: string | null; questionIds?: string[] }
export interface PracticeAttempt {
  id: string; sessionId: string; questionId: string; knowledgeId: string; answer: Answer;
  correct: boolean; hintViewed: boolean; cardViewed: boolean; answeredAt: string;
  contentRevision: string; gradingRuleVersion: string; questionSnapshot: string;
}
export interface CourseProgress {
  textbookDone: boolean; recordingDone: boolean; lastLocation: string | null;
  viewedCardIds: string[]; sessions: PracticeSession[]; attempts: PracticeAttempt[];
}
export interface Snapshot {
  settings: Settings;
  visits: Visit[];
  frameworkProgress: FrameworkProgress;
  courseProgress: CourseProgress;
  storage: { mode: 'sqlite' | 'preview'; path: string | null };
}
export interface DesktopAPI {
  getSnapshot(): Promise<Snapshot>;
  updateSettings(settings: Settings): Promise<Snapshot>;
  recordVisit(visit: VisitInput): Promise<Snapshot>;
  setMaterialStatus(field: 'textbookDone' | 'recordingDone', done: boolean): Promise<Snapshot>;
  viewKnowledgeCard(cardId: string, preservePosition?: boolean): Promise<Snapshot>;
  startPractice(scope: string, restart?: boolean): Promise<Snapshot>;
  submitAnswer(sessionId: string, questionId: string, answer: Answer, hintViewed: boolean, cardViewed: boolean): Promise<Snapshot>;
  completePractice(sessionId: string): Promise<Snapshot>;
}
declare global { interface Window { deutschlab?: DesktopAPI } }
