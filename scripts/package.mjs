import { packager } from '@electron/packager';
import { cp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const staging = resolve('release/staging');
await mkdir(staging, { recursive: true });
await cp('dist', `${staging}/dist`, { recursive: true });
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(`${staging}/package.json`, JSON.stringify({
  name: pkg.name, productName: pkg.productName, version: pkg.version,
  main: pkg.main, description: pkg.description,
}, null, 2));
const electronVersion = JSON.parse(await readFile('node_modules/electron/package.json', 'utf8')).version;
const checksums = JSON.parse(await readFile('node_modules/electron/checksums.json', 'utf8'));
const result = await packager({
  dir: staging, out: 'release', name: 'DeutschLab',
  platform: 'darwin', arch: 'arm64', electronVersion,
  appBundleId: 'local.deutschlab.desktop', appVersion: pkg.version,
  overwrite: true, asar: true,
  download: { checksums },
});
console.log(`桌面应用已生成：${result.join(', ')}`);
