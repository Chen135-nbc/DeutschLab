import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopAPI } from '../shared/contracts';

const api: DesktopAPI = {
  getSnapshot: () => ipcRenderer.invoke('profile:read'),
  updateSettings: settings => ipcRenderer.invoke('settings:update', settings),
  recordVisit: visit => ipcRenderer.invoke('history:visit', visit),
  setMaterialStatus: (field, done) => ipcRenderer.invoke('course:material', field, done),
  viewKnowledgeCard: (cardId, preservePosition) => ipcRenderer.invoke('course:card', cardId, preservePosition ?? false),
  startPractice: (scope, restart) => ipcRenderer.invoke('practice:start', scope, restart),
  submitAnswer: (sessionId, questionId, answer, hintViewed, cardViewed) => ipcRenderer.invoke('practice:answer', sessionId, questionId, answer, hintViewed, cardViewed),
  completePractice: sessionId => ipcRenderer.invoke('practice:complete', sessionId),
};
contextBridge.exposeInMainWorld('deutschlab', api);
