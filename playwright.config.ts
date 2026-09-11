import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
process.env['E2E_EMAIL'] ??= 'browser-test@example.test';
process.env['E2E_PASSWORD'] ??= randomBytes(18).toString('hex');
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:4201',
    headless: true,
    viewport: { width: 1440, height: 1100 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -w backend',
      url: 'http://localhost:3002/api/health',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        DEMO_EMAIL: process.env['E2E_EMAIL'],
        DEMO_PASSWORD: process.env['E2E_PASSWORD'],
        PORT: '3002',
        DEMO_ACCESS: 'true',
        JWT_SECRET: randomBytes(40).toString('hex'),
      },
    },
    {
      command:
        'npm start -w frontend -- --host 127.0.0.1 --port 4201 --proxy-config ../e2e/proxy.conf.cjs',
      url: 'http://localhost:4201',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
