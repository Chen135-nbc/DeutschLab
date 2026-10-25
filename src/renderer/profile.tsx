import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { resolveVisit } from '../domain/catalog';
import type { DesktopAPI, Settings, Snapshot, VisitInput, VisitKind } from '../shared/contracts';
import { fontSizePixels } from '../shared/typography';
import { getKnowledgeCard, getPracticeQuestion, getStudioPack, gradeQuestion, parsePracticeScope, questionsForScope, selectPracticeQuestions, studioUnit, startPack } from '../domain/studio21';
import { getExtensionPack, extensionItem, extensionIsProduction, selectExtensionItems, gradeExtensionObjective } from '../domain/extension';
import { a1Scaffold } from '../domain/framework';

function previewAPI(): DesktopAPI {
  let snapshot: Snapshot = {
    settings: { level: 'A1', fontSize: 'standard', reducedMotion: false }, visits: [],
    frameworkProgress: { learning: {}, application: {} },
    courseProgress: { textbookDone: false, recordingDone: false, basicCompleted: false, lastLocation: null, viewedCardIds: [], sessions: [], attempts: [] },
    startProgress: { textbookDone: false, recordingDone: false, basicCompleted: false, lastLocation: null, viewedCardIds: [], sessions: [], attempts: [] },
    extensionProgress: { viewedCardIds: [], lastPositions: {}, sessions: [], attempts: [] },
    storage: { mode: 'preview', path: null },
  };
  const progressFor = (unitId: string) => unitId === startPack.unit.id ? snapshot.startProgress : snapshot.courseProgress;
  function refreshExtensionProgress(topicId: string) {
    const pack = getExtensionPack(topicId)!;
    const viewed = new Set(snapshot.extensionProgress.viewedCardIds);
    const coveredOutlineIds = pack.sections.filter(section => section.cardIds.some(id => viewed.has(id))).map(section => section.outlineId);
    const completed = snapshot.extensionProgress.sessions.find(item => item.topicId === topicId && item.completedAt);
    if (coveredOutlineIds.length) snapshot.frameworkProgress.learning[topicId] = {
      unitId: topicId, status: pack.cards.every(card => viewed.has(card.id)) && completed ? 'studied' : 'partially_covered',
      coveredOutlineIds, updatedAt: completed?.completedAt ?? new Date().toISOString(),
    };
    const latestAttempt = snapshot.extensionProgress.attempts.find(item => item.topicId === topicId);
    if (latestAttempt) {
      const node = a1Scaffold.nodeByUnitId.get(topicId)!;
      snapshot.frameworkProgress.application[node.id] = {
        nodeId: node.id, status: 'in_practice', source: 'practice', evidenceIds: [latestAttempt.id],
        note: '已有专题练习记录；不能据此认定独立运用能力完全掌握。', updatedAt: latestAttempt.answeredAt,
      };
    }
  }
  return {
    async getSnapshot() { return structuredClone(snapshot); },
    async updateSettings(settings) { snapshot = { ...snapshot, settings }; return structuredClone(snapshot); },
    async recordVisit(visit) {
      const title = resolveVisit(visit.kind, visit.refId);
      if (!title) throw new Error('浏览对象不存在。');
      snapshot = { ...snapshot, visits: [{ ...visit, id: crypto.randomUUID(), title, visitedAt: new Date().toISOString() }, ...snapshot.visits] };
      return structuredClone(snapshot);
    },
    async setMaterialStatus(field, done, unitId = studioUnit.id) { if (!getStudioPack(unitId)) throw new Error('课程不存在。'); progressFor(unitId)[field] = done; return structuredClone(snapshot); },
    async viewKnowledgeCard(cardId, preservePosition = false) {
      const card = getKnowledgeCard(cardId);
      if (!card) throw new Error('知识卡不存在。');
      const progress = progressFor(card.unitId);
      progress.viewedCardIds = [...new Set([...progress.viewedCardIds, cardId])];
      if (!preservePosition) progress.lastLocation = `/focus/studio21/${cardId}`;
      return structuredClone(snapshot);
    },
    async startPractice(scope, restart = false, unitId = studioUnit.id) {
      const pack = getStudioPack(unitId);
      if (!pack || !questionsForScope(parsePracticeScope(scope).sectionId, pack).length) throw new Error('练习范围无效。');
      const progress = progressFor(unitId);
      if (restart || !progress.sessions.some(session => session.scope === scope && !session.completedAt)) {
        const id = crypto.randomUUID();
        const wrong = progress.attempts.filter(item => !item.correct);
        progress.sessions.unshift({ id, scope, createdAt: new Date().toISOString(), completedAt: null, contentRevision: 'preview', questionIds: selectPracticeQuestions(scope, wrong.map(item => item.knowledgeId), id, wrong.map(item => item.questionId), pack).map(question => question.id) });
      }
      progress.lastLocation = unitId === studioUnit.id ? `/focus/studio21/practice/${scope}` : `/focus/studio21/${unitId}/practice/${scope}`;
      return structuredClone(snapshot);
    },
    async submitAnswer(sessionId, questionId, answer, hintViewed, cardViewed) {
      const question = getPracticeQuestion(questionId);
      const unitId = startPack.questions.some(item => item.id === questionId) ? startPack.unit.id : studioUnit.id;
      const progress = progressFor(unitId);
      if (!question || !progress.sessions.some(session => session.id === sessionId)) throw new Error('练习记录无效。');
      progress.attempts.unshift({ id: crypto.randomUUID(), sessionId, questionId, knowledgeId: question.knowledgeId, answer, correct: gradeQuestion(question, answer), hintViewed, cardViewed, answeredAt: new Date().toISOString(), contentRevision: 'preview', gradingRuleVersion: question.gradingRule ?? 'exact-structured-answer-v1', questionSnapshot: JSON.stringify(question) });
      return structuredClone(snapshot);
    },
    async completePractice(sessionId) {
      const unitId = snapshot.startProgress.sessions.some(item => item.id === sessionId) ? startPack.unit.id : studioUnit.id;
      const progress = progressFor(unitId);
      const session = progress.sessions.find(item => item.id === sessionId);
      if (!session || progress.attempts.filter(item => item.sessionId === sessionId).length !== (session.questionIds ?? questionsForScope(session.scope, getStudioPack(unitId)!).map(q => q.id)).length) throw new Error('练习尚未完成。');
      session.completedAt = new Date().toISOString();
      if (unitId === startPack.unit.id && session.scope === 'assessment') progress.basicCompleted ||= progress.attempts.filter(item => item.sessionId === sessionId && item.correct).length >= Math.ceil((session.questionIds?.length ?? startPack.unit.assessmentIds.length) * 0.8);
      const sectionId = parsePracticeScope(session.scope).sectionId;
      progress.lastLocation = sectionId === 'assessment' ? `/courses/${unitId}` : `/courses/${unitId}/sections/${sectionId}`;
      return structuredClone(snapshot);
    },
    async viewExtensionCard(topicId, cardId) {
      if (!getExtensionPack(topicId)?.cards.some(card => card.id === cardId)) throw new Error('拓展知识卡不存在。');
      snapshot.extensionProgress.viewedCardIds = [...new Set([...snapshot.extensionProgress.viewedCardIds, cardId])];
      snapshot.extensionProgress.lastPositions[topicId] = `/focus/extension/${topicId}/cards/${cardId}`;
      refreshExtensionProgress(topicId);
      return structuredClone(snapshot);
    },
    async startExtensionPractice(topicId, restart = false, taskId) {
      const pack = getExtensionPack(topicId);
      if (!pack) throw new Error('拓展练习不存在。');
      const task = taskId ? pack.tasks.find(item => item.id === taskId) : undefined;
      if (taskId && !task) throw new Error('小任务不存在。');
      const scope = task?.id ?? 'practice';
      if (restart || !snapshot.extensionProgress.sessions.some(session => session.topicId === topicId && session.scope === scope && !session.completedAt)) {
        const id = crypto.randomUUID();
        const wrong = snapshot.extensionProgress.attempts.filter(item => item.topicId === topicId && (item.correct === false || item.selfCheck === 'needs_work')).map(item => item.knowledgeId);
        snapshot.extensionProgress.sessions.unshift({ id, topicId, scope, itemIds: task ? task.itemIds : selectExtensionItems(pack, id, wrong), contentRevision: 'preview', createdAt: new Date().toISOString(), completedAt: null });
      }
      snapshot.extensionProgress.lastPositions[topicId] = `/focus/extension/${topicId}/practice${task ? `?task=${task.id}` : ''}`;
      return structuredClone(snapshot);
    },
    async submitExtensionAnswer(sessionId, itemId, answer, selfCheck) {
      const session = snapshot.extensionProgress.sessions.find(item => item.id === sessionId);
      const pack = session && getExtensionPack(session.topicId);
      const item = pack && extensionItem(pack, itemId);
      if (!session || !item || !session.itemIds.includes(itemId)) throw new Error('拓展题目不存在。');
      const production = extensionIsProduction(item);
      if (production && (typeof answer !== 'string' || !answer.trim() || !['can_do', 'needs_work'].includes(selfCheck ?? ''))) throw new Error('请完成自我核对。');
      if (!production && (typeof answer !== 'string' || !item.options?.some(option => option.id === answer))) throw new Error('请选择答案。');
      snapshot.extensionProgress.attempts.unshift({ id: crypto.randomUUID(), sessionId, topicId: session.topicId, itemId, knowledgeId: item.knowledgeId,
        answer, correct: production ? null : gradeExtensionObjective(item, answer), selfCheck: production ? selfCheck! : null,
        answeredAt: new Date().toISOString(), itemSnapshot: JSON.stringify(item) });
      refreshExtensionProgress(session.topicId);
      return structuredClone(snapshot);
    },
    async completeExtensionPractice(sessionId) {
      const session = snapshot.extensionProgress.sessions.find(item => item.id === sessionId);
      if (!session || snapshot.extensionProgress.attempts.filter(item => item.sessionId === sessionId).length !== session.itemIds.length) throw new Error('练习未完成。');
      session.completedAt = new Date().toISOString();
      snapshot.extensionProgress.lastPositions[session.topicId] = `/topics/${session.topicId}`;
      refreshExtensionProgress(session.topicId);
      return structuredClone(snapshot);
    },
  };
}
const api = window.deutschlab ?? previewAPI();
interface ProfileContext {
  snapshot: Snapshot;
  updateSettings(settings: Settings): Promise<void>;
  recordVisit(visit: VisitInput): Promise<void>;
  setMaterialStatus(field: 'textbookDone' | 'recordingDone', done: boolean, unitId?: string): Promise<void>;
  viewKnowledgeCard(cardId: string, preservePosition?: boolean): Promise<void>;
  startPractice(scope: string, restart?: boolean, unitId?: string): Promise<Snapshot>;
  submitAnswer(sessionId: string, questionId: string, answer: string | string[], hintViewed: boolean, cardViewed: boolean): Promise<Snapshot>;
  completePractice(sessionId: string): Promise<void>;
  viewExtensionCard(topicId: string, cardId: string): Promise<void>;
  startExtensionPractice(topicId: string, restart?: boolean, taskId?: string): Promise<Snapshot>;
  submitExtensionAnswer(sessionId: string, itemId: string, answer: string, selfCheck?: 'can_do' | 'needs_work'): Promise<Snapshot>;
  completeExtensionPractice(sessionId: string): Promise<void>;
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
  const setMaterialStatus = useCallback(async (field: 'textbookDone' | 'recordingDone', done: boolean, unitId?: string) => { await mutate(() => api.setMaterialStatus(field, done, unitId)); }, [mutate]);
  const viewKnowledgeCard = useCallback(async (cardId: string, preservePosition = false) => { await mutate(() => api.viewKnowledgeCard(cardId, preservePosition)); }, [mutate]);
  const startPractice = useCallback((scope: string, restart = false, unitId?: string) => mutate(() => api.startPractice(scope, restart, unitId)), [mutate]);
  const submitAnswer = useCallback((sessionId: string, questionId: string, answer: string | string[], hintViewed: boolean, cardViewed: boolean) => mutate(() => api.submitAnswer(sessionId, questionId, answer, hintViewed, cardViewed)), [mutate]);
  const completePractice = useCallback(async (sessionId: string) => { await mutate(() => api.completePractice(sessionId)); }, [mutate]);
  const viewExtensionCard = useCallback(async (topicId: string, cardId: string) => { await mutate(() => api.viewExtensionCard(topicId, cardId)); }, [mutate]);
  const startExtensionPractice = useCallback((topicId: string, restart = false, taskId?: string) => mutate(() => api.startExtensionPractice(topicId, restart, taskId)), [mutate]);
  const submitExtensionAnswer = useCallback((sessionId: string, itemId: string, answer: string, selfCheck?: 'can_do' | 'needs_work') => mutate(() => api.submitExtensionAnswer(sessionId, itemId, answer, selfCheck)), [mutate]);
  const completeExtensionPractice = useCallback(async (sessionId: string) => { await mutate(() => api.completeExtensionPractice(sessionId)); }, [mutate]);
  if (error) return <div className="boot-screen"><h1>本地档案暂时不可用</h1><p>{error}</p><button className="button primary" onClick={load}>重新读取</button></div>;
  if (!snapshot) return <div className="boot-screen"><div className="brand-mark">D.</div><p>正在打开你的学习工作台…</p></div>;
  return <Context.Provider value={{ snapshot, updateSettings, recordVisit, setMaterialStatus, viewKnowledgeCard, startPractice, submitAnswer, completePractice, viewExtensionCard, startExtensionPractice, submitExtensionAnswer, completeExtensionPractice, notify }}>
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
