import { build } from 'esbuild';

await build({
  entryPoints: {
    'main/index': 'src/main/index.ts',
    'main/store': 'src/main/store.ts',
    'domain/framework': 'src/domain/framework.ts',
    'domain/progress': 'src/domain/progress.ts',
    'domain/studio21': 'src/domain/studio21.ts',
    'domain/extension': 'src/domain/extension.ts',
    'preload/index': 'src/preload/index.ts',
  },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  external: ['electron'],
  outExtension: { '.js': '.cjs' },
});
