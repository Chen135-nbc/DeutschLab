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
  viewExtensionCard: (topicId, cardId) => ipcRenderer.invoke('extension:card', topicId, cardId),
  startExtensionPractice: (topicId, restart, taskId) => ipcRenderer.invoke('extension:start', topicId, restart ?? false, taskId),
  submitExtensionAnswer: (sessionId, itemId, answer, selfCheck) => ipcRenderer.invoke('extension:answer', sessionId, itemId, answer, selfCheck ?? null),
  completeExtensionPractice: sessionId => ipcRenderer.invoke('extension:complete', sessionId),
};
contextBridge.exposeInMainWorld('deutschlab', api);
