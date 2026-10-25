import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import electron from 'electron';

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, DEUTSCHLAB_DATA_DIR: process.env.DEUTSCHLAB_DATA_DIR || resolve('data/local') },
});
child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => { console.error(error); process.exit(1); });
