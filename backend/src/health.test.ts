import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from './app.js';
import { growth, previousPeriod, filterSales, dashboard } from './analytics.js';
import { sales, defaultRange } from './data.js';

const password = randomBytes(16).toString('hex');
const config = {
  email: 'analyst@example.test',
  passwordSalt: 'test-salt',
  passwordHash: scryptSync(password, 'test-salt', 64),
  jwtSecret: randomBytes(32).toString('hex'),
};
const app = createApp(config);
let token: string;
before(async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: config.email, password });
  assert.equal(response.status, 200);
  token = response.body.token;
});
test('health endpoint reports availability and secure headers', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});
test('protected endpoint rejects absent and expired tokens', async () => {
  assert.equal((await request(app).get('/api/dashboard')).status, 401);
  const expired = jwt.sign({ role: 'analyst' }, config.jwtSecret, {
    expiresIn: -1,
    issuer: 'fieldnote-api',
    audience: 'fieldnote-web',
  });
  assert.equal(
    (await request(app).get('/api/dashboard').auth(expired, { type: 'bearer' })).status,
    401,
  );
});
test('login rejects incorrect credentials without leaking account existence', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: config.email, password: 'incorrect' });
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Email or password is incorrect.');
});
test('query validation rejects reversed dates and excessive page sizes', async () => {
  for (const query of [
    { startDate: '2025-12-01', endDate: '2025-01-01' },
    { pageSize: 1000 },
    { region: 'unknown' },
    { startDate: '2025-02-30' },
  ]) {
    assert.equal(
      (await request(app).get('/api/products').auth(token, { type: 'bearer' }).query(query)).status,
      400,
    );
  }
});
test('products endpoint applies filters, sorting, search and pagination', async () => {
  const response = await request(app)
    .get('/api/products')
    .auth(token, { type: 'bearer' })
    .query({ category: 'Beverages', sort: 'name', direction: 'asc', pageSize: 2 });
  assert.equal(response.status, 200);
  assert.equal(response.body.total, 4);
  assert.equal(response.body.items.length, 2);
  assert.equal(response.body.items[0].name, 'Cold Brew Original');
  const search = await request(app)
    .get('/api/products')
    .auth(token, { type: 'bearer' })
    .query({ search: 'granola' });
  assert.equal(search.body.total, 1);
});
test('missing product returns a useful 404', async () => {
  assert.equal(
    (await request(app).get('/api/products/missing').auth(token, { type: 'bearer' })).status,
    404,
  );
});
test('growth handles zero baseline and equal-length previous periods', () => {
  assert.equal(growth(120, 100), 20);
  assert.equal(growth(120, 0), null);
  assert.deepEqual(previousPeriod({ startDate: '2025-03-01', endDate: '2025-03-10' }), {
    startDate: '2025-02-19',
    endDate: '2025-02-28',
  });
});
test('aggregates reconcile with filtered source rows and empty selections', () => {
  const filters = {
    ...defaultRange,
    category: 'Pantry',
    region: 'North',
    retailer: 'Daily Basket',
    customerSegment: 'Value seekers',
  };
  const rows = filterSales(filters);
  const result = dashboard(filters);
  assert.ok(rows.length > 0);
  assert.equal(
    result.unitsSold,
    rows.reduce((sum, row) => sum + row.unitsSold, 0),
  );
  assert.ok(Math.abs(result.revenue - rows.reduce((sum, row) => sum + row.revenue, 0)) < 0.01);
  assert.equal(result.averageOrderValue, result.revenue / result.orders);
  assert.ok(result.categoryShare > 0 && result.categoryShare < 100);
  assert.equal(filterSales({ ...defaultRange, category: 'missing' }).length, 0);
  assert.equal(dashboard({ ...defaultRange, category: 'missing' }).averageOrderValue, 0);
  assert.equal(sales.length, 23392);
});

test('sales ledger searches order IDs and returns the individual transaction', async () => {
  const response = await request(app)
    .get('/api/sales')
    .auth(token, { type: 'bearer' })
    .query({ search: 'order-23392', sort: 'orderId' });
  assert.equal(response.status, 200);
  assert.equal(response.body.total, 1);
  assert.deepEqual(
    response.body.items[0],
    sales.find((sale) => sale.orderId === 'order-23392'),
  );
  const productSearch = await request(app)
    .get('/api/sales')
    .auth(token, { type: 'bearer' })
    .query({ search: 'Granola' });
  assert.ok(productSearch.body.total > 1);
  assert.ok(
    productSearch.body.items.every(
      (sale: { productName: string }) => sale.productName === 'Harvest Granola',
    ),
  );
});
