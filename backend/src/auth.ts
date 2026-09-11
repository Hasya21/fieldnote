import { scryptSync, timingSafeEqual } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { AuthConfig } from './config.js';
const issuer = 'fieldnote-api';
const audience = 'fieldnote-web';
export function authRouter(config: AuthConfig) {
  const router = Router();
  router.get('/config', (_req, res) => res.json({ demoAccess: config.demoAccess === true }));
  router.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' },
    }),
  );
  const session = (guest: boolean) => ({
    token: jwt.sign({ role: 'analyst' }, config.jwtSecret, {
      algorithm: 'HS256',
      subject: guest ? 'guest-analyst' : 'demo-analyst',
      expiresIn: '30m',
      issuer,
      audience,
    }),
    expiresAt: Date.now() + 30 * 60 * 1000,
    user: {
      name: guest ? 'Guest analyst' : 'Demo analyst',
      email: guest ? 'guest@fieldnote.example' : config.email,
    },
  });
  router.post('/demo', (_req, res) => {
    if (!config.demoAccess) {
      res.status(403).json({ message: 'Guest access is disabled on this installation.' });
      return;
    }
    res.json(session(true));
  });
  router.post('/login', (req, res) => {
    const result = z
      .object({ email: z.email().max(254), password: z.string().min(1).max(256) })
      .strict()
      .safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: 'Enter a valid email and password.' });
      return;
    }
    const hash = scryptSync(result.data.password, config.passwordSalt, 64);
    if (
      !timingSafeEqual(hash, config.passwordHash) ||
      result.data.email.toLowerCase() !== config.email.toLowerCase()
    ) {
      res.status(401).json({ message: 'Email or password is incorrect.' });
      return;
    }
    res.json(session(false));
  });
  return router;
}
export function requireAuth(config: AuthConfig): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Please sign in to continue.' });
      return;
    }
    try {
      const payload = jwt.verify(header.slice(7), config.jwtSecret, {
        algorithms: ['HS256'],
        issuer,
        audience,
      });
      if (typeof payload === 'string' || payload['role'] !== 'analyst') {
        res.status(403).json({ message: 'This account does not have analyst access.' });
        return;
      }
      next();
    } catch {
      res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
  };
}
