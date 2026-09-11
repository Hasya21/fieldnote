import { formatMetric } from './metric.pipe';
it('formats zero, missing comparisons, signed growth and USD values distinctly', () => {
  expect(formatMetric(0, 'currency')).toBe('$0');
  expect(formatMetric(null, 'growth')).toBe('—');
  expect(formatMetric(12.34, 'growth')).toBe('+12.3%');
  expect(formatMetric(-8, 'growth')).toBe('-8.0%');
  expect(formatMetric(1234.5, 'currency')).toBe('$1,235');
});
