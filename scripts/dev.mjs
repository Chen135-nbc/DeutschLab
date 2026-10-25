import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import electron from 'electron';
import './build-electron.mjs';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' });
let desktop;
let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  desktop?.kill();
  server.kill();
  process.exitCode = code;
};
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
server.on('error', error => { console.error(error); stop(1); });
server.on('exit', code => { if (!stopping) stop(code || 1); });
let ready = false;
for (let i = 0; i < 100 && !stopping; i++) {
  try { ready = (await fetch('http://127.0.0.1:5173')).ok; } catch { /* Wait for Vite. */ }
  if (ready) break;
  await new Promise(r => setTimeout(r, 100));
}
if (!ready) {
  console.error('开发服务器未能启动。');
  stop(1);
} else {
  desktop = spawn(electron, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, DEUTSCHLAB_DEV_URL: 'http://127.0.0.1:5173', DEUTSCHLAB_DATA_DIR: process.env.DEUTSCHLAB_DATA_DIR || resolve('data/local') },
  });
  desktop.on('exit', code => stop(code ?? 0));
  desktop.on('error', error => { console.error(error); stop(1); });
}
