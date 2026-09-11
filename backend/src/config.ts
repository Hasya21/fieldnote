import { randomBytes, scryptSync } from 'node:crypto';
import { z } from 'zod';

export interface AuthConfig {
  demoAccess?: boolean;
  email: string;
  passwordHash: Buffer;
  passwordSalt: string;
  jwtSecret: string;
}
export function loadConfig(): AuthConfig {
  const env = z
    .object({
      DEMO_EMAIL: z.email(),
      DEMO_PASSWORD: z.string().min(12),
      JWT_SECRET: z.string().min(32),
    })
    .safeParse(process.env);
  if (!env.success)
    throw new Error(
      'Set DEMO_EMAIL, DEMO_PASSWORD (12+ characters) and JWT_SECRET (32+ characters) in backend/.env. See README.',
    );
  const passwordSalt = randomBytes(16).toString('hex');
  return {
    demoAccess: process.env['DEMO_ACCESS'] === 'true',
    email: env.data.DEMO_EMAIL,
    passwordSalt,
    passwordHash: scryptSync(env.data.DEMO_PASSWORD, passwordSalt, 64),
    jwtSecret: env.data.JWT_SECRET,
  };
}
