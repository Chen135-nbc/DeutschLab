import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { resolveVisit } from '../domain/catalog';
import type { DesktopAPI, Settings, Snapshot, VisitInput, VisitKind } from '../shared/contracts';
import { fontSizePixels } from '../shared/typography';
import { getKnowledgeCard, getPracticeQuestion, gradeQuestion, parsePracticeScope, questionsForScope, selectPracticeQuestions, studioUnit } from '../domain/studio21';

function previewAPI(): DesktopAPI {
  let snapshot: Snapshot = {
    settings: { level: 'A1', fontSize: 'standard', reducedMotion: false }, visits: [],
    frameworkProgress: { learning: {}, application: {} },
    courseProgress: { textbookDone: false, recordingDone: false, lastLocation: null, viewedCardIds: [], sessions: [], attempts: [] },
    storage: { mode: 'preview', path: null },
  };
  return {
    async getSnapshot() { return structuredClone(snapshot); },
    async updateSettings(settings) { snapshot = { ...snapshot, settings }; return structuredClone(snapshot); },
    async recordVisit(visit) {
      const title = resolveVisit(visit.kind, visit.refId);
      if (!title) throw new Error('浏览对象不存在。');
      snapshot = { ...snapshot, visits: [{ ...visit, id: crypto.randomUUID(), title, visitedAt: new Date().toISOString() }, ...snapshot.visits] };
      return structuredClone(snapshot);
    },
    async setMaterialStatus(field, done) { snapshot.courseProgress[field] = done; return structuredClone(snapshot); },
    async viewKnowledgeCard(cardId, preservePosition = false) {
      const card = getKnowledgeCard(cardId);
      if (!card) throw new Error('知识卡不存在。');
      snapshot.courseProgress.viewedCardIds = [...new Set([...snapshot.courseProgress.viewedCardIds, cardId])];
      if (!preservePosition) snapshot.courseProgress.lastLocation = `/focus/studio21/${cardId}`;
      return structuredClone(snapshot);
    },
    async startPractice(scope, restart = false) {
      if (!questionsForScope(parsePracticeScope(scope).sectionId).length) throw new Error('练习范围无效。');
      if (restart || !snapshot.courseProgress.sessions.some(session => session.scope === scope && !session.completedAt)) {
        const id = crypto.randomUUID();
        const wrong = snapshot.courseProgress.attempts.filter(item => !item.correct);
        snapshot.courseProgress.sessions.unshift({ id, scope, createdAt: new Date().toISOString(), completedAt: null, contentRevision: 'preview', questionIds: selectPracticeQuestions(scope, wrong.map(item => item.knowledgeId), id, wrong.map(item => item.questionId)).map(question => question.id) });
      }
      snapshot.courseProgress.lastLocation = `/focus/studio21/practice/${scope}`;
      return structuredClone(snapshot);
    },
    async submitAnswer(sessionId, questionId, answer, hintViewed, cardViewed) {
      const question = getPracticeQuestion(questionId);
      if (!question || !snapshot.courseProgress.sessions.some(session => session.id === sessionId)) throw new Error('练习记录无效。');
      snapshot.courseProgress.attempts.unshift({ id: crypto.randomUUID(), sessionId, questionId, knowledgeId: question.knowledgeId, answer, correct: gradeQuestion(question, answer), hintViewed, cardViewed, answeredAt: new Date().toISOString(), contentRevision: 'preview', gradingRuleVersion: question.gradingRule ?? 'exact-structured-answer-v1', questionSnapshot: JSON.stringify(question) });
      return structuredClone(snapshot);
    },
    async completePractice(sessionId) {
      const session = snapshot.courseProgress.sessions.find(item => item.id === sessionId);
      if (!session || snapshot.courseProgress.attempts.filter(item => item.sessionId === sessionId).length !== (session.questionIds ?? questionsForScope(session.scope).map(q => q.id)).length) throw new Error('练习尚未完成。');
      session.completedAt = new Date().toISOString();
      const sectionId = parsePracticeScope(session.scope).sectionId;
      snapshot.courseProgress.lastLocation = sectionId === 'assessment' ? `/courses/${studioUnit.id}` : `/courses/${studioUnit.id}/sections/${sectionId}`;
      return structuredClone(snapshot);
    },
  };
}
const api = window.deutschlab ?? previewAPI();
interface ProfileContext {
  snapshot: Snapshot;
  updateSettings(settings: Settings): Promise<void>;
  recordVisit(visit: VisitInput): Promise<void>;
  setMaterialStatus(field: 'textbookDone' | 'recordingDone', done: boolean): Promise<void>;
  viewKnowledgeCard(cardId: string, preservePosition?: boolean): Promise<void>;
  startPractice(scope: string, restart?: boolean): Promise<Snapshot>;
  submitAnswer(sessionId: string, questionId: string, answer: string | string[], hintViewed: boolean, cardViewed: boolean): Promise<Snapshot>;
  completePractice(sessionId: string): Promise<void>;
  notify(message: string): void;
}
const Context = createContext<ProfileContext | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const queue = useRef(Promise.resolve());
  const notify = useCallback((message: string) => setToast(message), []);
  const load = useCallback(() => { setError(''); void api.getSnapshot().then(setSnapshot).catch(() => setError('无法读取本地档案。请重试；现有数据不会自动重置。')); }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!snapshot) return;
    document.documentElement.dataset.fontSize = String(snapshot.settings.fontSize);
    document.documentElement.style.setProperty('--app-font-size', `${fontSizePixels(snapshot.settings.fontSize)}px`);
    document.documentElement.dataset.reducedMotion = String(snapshot.settings.reducedMotion);
  }, [snapshot]);
  const mutate = useCallback((action: () => Promise<Snapshot>) => {
    const pending = queue.current.then(action).then(result => { setSnapshot(result); return result; });
    queue.current = pending.then(() => undefined).catch(() => { notify('保存失败，请重试。当前操作未标记为学习成果。'); });
    return pending;
  }, [notify]);
  const updateSettings = useCallback(async (settings: Settings) => { await mutate(() => api.updateSettings(settings)); }, [mutate]);
  const recordVisit = useCallback(async (visit: VisitInput) => { await mutate(() => api.recordVisit(visit)); }, [mutate]);
  const setMaterialStatus = useCallback(async (field: 'textbookDone' | 'recordingDone', done: boolean) => { await mutate(() => api.setMaterialStatus(field, done)); }, [mutate]);
  const viewKnowledgeCard = useCallback(async (cardId: string, preservePosition = false) => { await mutate(() => api.viewKnowledgeCard(cardId, preservePosition)); }, [mutate]);
  const startPractice = useCallback((scope: string, restart = false) => mutate(() => api.startPractice(scope, restart)), [mutate]);
  const submitAnswer = useCallback((sessionId: string, questionId: string, answer: string | string[], hintViewed: boolean, cardViewed: boolean) => mutate(() => api.submitAnswer(sessionId, questionId, answer, hintViewed, cardViewed)), [mutate]);
  const completePractice = useCallback(async (sessionId: string) => { await mutate(() => api.completePractice(sessionId)); }, [mutate]);
  if (error) return <div className="boot-screen"><h1>本地档案暂时不可用</h1><p>{error}</p><button className="button primary" onClick={load}>重新读取</button></div>;
  if (!snapshot) return <div className="boot-screen"><div className="brand-mark">D.</div><p>正在打开你的学习工作台…</p></div>;
  return <Context.Provider value={{ snapshot, updateSettings, recordVisit, setMaterialStatus, viewKnowledgeCard, startPractice, submitAnswer, completePractice, notify }}>
    {children}
    {toast && <div className="toast" role="status">{toast}</div>}
  </Context.Provider>;
}
export const useProfile = () => {
  const context = useContext(Context);
  if (!context) throw new Error('Missing ProfileProvider');
  return context;
};
export function useRecordVisit(kind: VisitKind, refId?: string) {
  const { recordVisit } = useProfile();
  const last = useRef('');
  useEffect(() => {
    if (!refId) return;
    const key = `${kind}:${refId}`;
    if (last.current === key) return;
    last.current = key;
    void recordVisit({ kind, refId }).catch(() => { last.current = ''; });
  }, [kind, refId, recordVisit]);
}
