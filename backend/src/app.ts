import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { AuthConfig } from './config.js';
import { authRouter, requireAuth } from './auth.js';
import { queryApi } from './query-api.js';
export function createApp(config: AuthConfig) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '8kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/auth', authRouter(config));
  app.use('/api', requireAuth(config));
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { message: 'Request limit reached. Please wait a minute.' },
    }),
  );
  app.use('/api', (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).json({ message: 'This demo only supports read operations.' });
      return;
    }
    const result = queryApi('/api' + req.path, req.query);
    if (result.headers) res.set(result.headers);
    if (typeof result.body === 'string') res.status(result.status).send(result.body);
    else res.status(result.status).json(result.body);
  });
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const status =
      typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500;
    res.status(status >= 400 && status < 500 ? status : 500).json({
      message:
        status === 400
          ? 'Request body is not valid JSON.'
          : status === 413
            ? 'Request body is too large.'
            : 'An unexpected server error occurred.',
    });
  };
  app.use(errorHandler);
  return app;
}
