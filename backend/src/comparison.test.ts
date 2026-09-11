import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboard, previousPeriod, productMetrics } from './analytics.js';
import { queryApi, csvCell } from './query-api.js';
const filters = { startDate: '2025-07-10', endDate: '2025-09-17' };
test('aligned prior trend reconciles with previous revenue across partial months', () => {
  const result = dashboard(filters);
  assert.ok(result.previous);
  assert.equal(result.previousTrend.length, result.trend.length);
  assert.ok(
    Math.abs(
      result.previousTrend.reduce((sum, point) => sum + point.value, 0) - result.previous.revenue,
    ) < 0.02,
  );
  assert.equal(result.trend[0].label, result.previousTrend[0].label);
});
test('incomplete baseline is unavailable, not misleading partial-period growth', () => {
  const result = dashboard({ startDate: '2024-01-01', endDate: '2024-01-31' });
  assert.equal(result.previous, null);
  assert.equal(result.growth, null);
  assert.deepEqual(result.previousTrend, []);
  assert.deepEqual(result.insights, []);
  assert.match(result.comparisonReason ?? '', /beyond/);
});
test('leap-day comparison preserves inclusive interval length', () => {
  assert.deepEqual(previousPeriod({ startDate: '2024-03-01', endDate: '2024-03-02' }), {
    startDate: '2024-02-28',
    endDate: '2024-02-29',
  });
});
test('product comparisons contain consistent trends and validate count and duplicates', () => {
  assert.equal(queryApi('/api/compare', { ...filters, ids: 'p01,p02' }).status, 200);
  assert.equal(queryApi('/api/compare', { ids: 'p01,p01' }).status, 400);
  assert.equal(queryApi('/api/compare', { ids: 'p01,p02,p03,p04' }).status, 400);
  const product = productMetrics(filters)[0];
  assert.ok(
    Math.abs(product.revenue - product.trend.reduce((sum, point) => sum + point.value, 0)) < 0.02,
  );
});
test('CSV exports all matching records and escapes spreadsheet formulas', () => {
  const result = queryApi('/api/sales/export', { search: 'order-23392', pageSize: '1' });
  assert.equal(result.status, 200);
  assert.match(String(result.body), /order-23392/);
  assert.equal(String(result.body).split('\r\n').length, 2);
  const all = queryApi('/api/sales/export', { pageSize: '1' });
  assert.ok(String(all.body).split('\r\n').length > 2);
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.equal(csvCell('a"b,c'), '"a""b,c"');
});
