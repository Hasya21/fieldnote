import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist/server', { recursive: true });
mkdirSync('dist/.openai', { recursive: true });
await build({
  entryPoints: ['hosting/worker.ts'],
  outfile: 'dist/server/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
});
cpSync('frontend/dist/insights/browser', 'dist/client', { recursive: true });
cpSync('.openai/hosting.json', 'dist/.openai/hosting.json');
