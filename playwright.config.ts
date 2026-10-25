import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', testMatch: 'desktop.spec.ts',
  workers: 1, fullyParallel: false, timeout: 30000,
  outputDir: 'test-results', reporter: 'list',
});
