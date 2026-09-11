import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
const port = Number(process.env['PORT'] ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT must be between 1 and 65535.');
const app = createApp(loadConfig());
if (process.env['NODE_ENV'] === 'production') {
  const directory = resolve(import.meta.dirname, '../../frontend/dist/insights/browser');
  app.use(express.static(directory, { maxAge: '1h' }));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(directory, 'index.html')));
}
const server = app.listen(port, process.env['HOST'] ?? '127.0.0.1', () =>
  console.log('Fieldnote API listening on port ' + port),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
