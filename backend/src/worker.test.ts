import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../hosting/worker.js';
import {
  dashboardSchema,
  productSchema,
  pageSchema,
  optionsSchema,
} from '../../frontend/src/app/shared/models/contracts.js';
import { queryApi } from './query-api.js';
const env = {
  JWT_SECRET: 'test-only-worker-secret-'.repeat(3),
  ASSETS: { fetch: async () => new Response('asset') },
};
test('hosted guest session authorizes shared analytics and rejects tampering', async () => {
  const absent = await worker.fetch(new Request('https://example.test/api/dashboard'), env);
  assert.equal(absent.status, 401);
  const response = await worker.fetch(
    new Request('https://example.test/api/auth/demo', { method: 'POST' }),
    env,
  );
  const session = (await response.json()) as { token: string };
  const headers = { Authorization: 'Bearer ' + session.token };
  assert.equal(
    (await worker.fetch(new Request('https://example.test/api/dashboard', { headers }), env))
      .status,
    200,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request('https://example.test/api/dashboard', {
          headers: { Authorization: headers.Authorization + 'x' },
        }),
        env,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request('https://example.test/api/products', { method: 'POST', headers }),
        env,
      )
    ).status,
    405,
  );
});
test('real API responses satisfy browser contracts', () => {
  assert.equal(dashboardSchema.safeParse(queryApi('/api/dashboard', {}).body).success, true);
  assert.equal(
    pageSchema(productSchema).safeParse(queryApi('/api/products', {}).body).success,
    true,
  );
  assert.equal(optionsSchema.safeParse(queryApi('/api/options', {}).body).success, true);
});
