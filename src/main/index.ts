import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { LocalStore } from './store';

app.setName('DeutschLab');
if (process.env.DEUTSCHLAB_DATA_DIR) {
  const dataDir = resolve(process.env.DEUTSCHLAB_DATA_DIR);
  mkdirSync(dataDir, { recursive: true });
  app.setPath('userData', dataDir);
}
let store: LocalStore | undefined;
const devUrl = !app.isPackaged ? process.env.DEUTSCHLAB_DEV_URL : undefined;

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 960, minHeight: 640,
    title: 'DeutschLab', backgroundColor: '#f6f7f2', show: false,
    titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, target) => {
    const current = win.webContents.getURL().split('#')[0];
    if (target.split('#')[0] !== current) event.preventDefault();
  });
  win.once('ready-to-show', () => { if (process.env.DEUTSCHLAB_TEST !== '1') win.show(); });
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(join(__dirname, '../renderer/index.html'));
  return win;
}

app.whenReady().then(() => {
  store = new LocalStore(join(app.getPath('userData'), 'deutschlab.sqlite'));
  const checkSender = (event: Electron.IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || event.senderFrame !== win.webContents.mainFrame) throw new Error('无效的桌面请求。');
  };
  ipcMain.handle('profile:read', event => { checkSender(event); return store!.snapshot(); });
  ipcMain.handle('settings:update', (event, value: unknown) => { checkSender(event); return store!.updateSettings(value); });
  ipcMain.handle('history:visit', (event, value: unknown) => { checkSender(event); return store!.recordVisit(value); });
  ipcMain.handle('course:material', (event, field: unknown, done: unknown) => { checkSender(event); return store!.setMaterialStatus(field, done); });
  ipcMain.handle('course:card', (event, cardId: unknown, preservePosition: unknown) => { checkSender(event); return store!.viewKnowledgeCard(cardId, preservePosition); });
  ipcMain.handle('practice:start', (event, scope: unknown, restart: unknown) => { checkSender(event); return store!.startPractice(scope, restart); });
  ipcMain.handle('practice:answer', (event, sessionId: unknown, questionId: unknown, answer: unknown, hintViewed: unknown, cardViewed: unknown) => { checkSender(event); return store!.submitAnswer(sessionId, questionId, answer, hintViewed, cardViewed); });
  ipcMain.handle('practice:complete', (event, sessionId: unknown) => { checkSender(event); return store!.completePractice(sessionId); });
  ipcMain.handle('extension:card', (event, topicId: unknown, cardId: unknown) => { checkSender(event); return store!.viewExtensionCard(topicId, cardId); });
  ipcMain.handle('extension:start', (event, topicId: unknown, restart: unknown, taskId: unknown) => { checkSender(event); return store!.startExtensionPractice(topicId, restart, taskId); });
  ipcMain.handle('extension:answer', (event, sessionId: unknown, itemId: unknown, answer: unknown, selfCheck: unknown) => { checkSender(event); return store!.submitExtensionAnswer(sessionId, itemId, answer, selfCheck); });
  ipcMain.handle('extension:complete', (event, sessionId: unknown) => { checkSender(event); return store!.completeExtensionPractice(sessionId); });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'DeutschLab', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'quit' }] },
    { label: '编辑', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: '窗口', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'close' }] },
  ]));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch(error => {
  console.error(error);
  dialog.showErrorBox('DeutschLab 启动失败', '本地数据无法打开。请确认数据目录可写；现有数据不会自动重置。');
  app.quit();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { store?.close(); store = undefined; });
