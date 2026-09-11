import { products, sales, dataRange } from './data.js';
import type { Filters, Sale, SeriesPoint, ProductMetrics } from './models.js';
const day = 86400000;
export function filterSales(filters: Filters, rows: Sale[] = sales): Sale[] {
  return rows.filter(
    (sale) =>
      sale.date >= filters.startDate &&
      sale.date <= filters.endDate &&
      (!filters.category || sale.category === filters.category) &&
      (!filters.region || sale.region === filters.region) &&
      (!filters.retailer || sale.retailer === filters.retailer) &&
      (!filters.customerSegment || sale.customerSegment === filters.customerSegment) &&
      (!filters.productId || sale.productId === filters.productId),
  );
}
export function revenue(rows: Sale[]): number {
  return Math.round(rows.reduce((sum, row) => sum + row.revenue, 0) * 100) / 100;
}
export function growth(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}
export function previousPeriod(filters: Filters): Filters {
  const start = Date.parse(filters.startDate);
  const duration = Date.parse(filters.endDate) - start + day;
  return {
    ...filters,
    startDate: new Date(start - duration).toISOString().slice(0, 10),
    endDate: new Date(start - day).toISOString().slice(0, 10),
  };
}
export function group(
  rows: Sale[],
  key: 'category' | 'region' | 'customerSegment' | 'productName',
): SeriesPoint[] {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row[key], (totals.get(row[key]) ?? 0) + row.revenue);
  return [...totals]
    .map(([label, value]) => ({
      label,
      value: Math.round(value * 100) / 100,
      ...(key === 'productName'
        ? { id: products.find((product) => product.name === label)?.id }
        : {}),
    }))
    .sort((a, b) => b.value - a.value);
}
export function trend(rows: Sale[], filters: Filters): SeriesPoint[] {
  const totals = new Map<string, number>();
  const cursor = new Date(filters.startDate.slice(0, 7) + '-01');
  while (cursor.toISOString().slice(0, 10) <= filters.endDate) {
    totals.set(cursor.toISOString().slice(0, 7), 0);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + row.revenue);
  }
  return [...totals].map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));
}
function metrics(rows: Sale[], filters: Filters) {
  const totalRevenue = revenue(rows);
  const orders = new Set(rows.map((row) => row.orderId)).size;
  const categoryBase = revenue(filterSales({ ...filters, category: undefined }));
  return {
    revenue: totalRevenue,
    unitsSold: rows.reduce((sum, row) => sum + row.unitsSold, 0),
    orders,
    averageOrderValue: orders ? totalRevenue / orders : 0,
    categoryShare: categoryBase ? (totalRevenue / categoryBase) * 100 : 0,
  };
}
export function dashboard(filters: Filters) {
  const rows = filterSales(filters);
  const previous = previousPeriod(filters);
  const oldRows = filterSales(previous);
  const complete = previous.startDate >= dataRange.startDate;
  const current = metrics(rows, filters);
  const prior = complete ? metrics(oldRows, previous) : null;
  // Shift prior days onto the current interval before monthly bucketing. Totals reconcile even for partial months.
  const offset = Date.parse(filters.startDate) - Date.parse(previous.startDate);
  const shiftedRows = oldRows.map((row) => ({
    ...row,
    date: new Date(Date.parse(row.date) + offset).toISOString().slice(0, 10),
  }));
  const insights = complete
    ? (['category', 'region'] as const).flatMap((dimension) => {
        const currentGroups = new Map(
          group(rows, dimension).map((point) => [point.label, point.value]),
        );
        const oldGroups = new Map(
          group(oldRows, dimension).map((point) => [point.label, point.value]),
        );
        const changes = [...new Set([...currentGroups.keys(), ...oldGroups.keys()])]
          .map((label) => {
            const value = currentGroups.get(label) ?? 0;
            const baseline = oldGroups.get(label) ?? 0;
            return {
              dimension,
              label,
              current: value,
              previous: baseline,
              delta: Math.round((value - baseline) * 100) / 100,
              growth: growth(value, baseline),
            };
          })
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
        return changes[0] && changes[0].delta !== 0 ? [changes[0]] : [];
      })
    : [];
  return {
    ...current,
    growth: prior ? growth(current.revenue, prior.revenue) : null,
    previous: prior,
    comparisonReason: !complete
      ? 'The prior period extends beyond available sample data.'
      : prior?.revenue === 0
        ? 'The prior period has zero revenue; percentage growth is unavailable.'
        : null,
    previousPeriod: previous,
    records: rows.length,
    trend: trend(rows, filters),
    previousTrend: complete ? trend(shiftedRows, filters) : [],
    insights,
    categories: group(rows, 'category'),
    regions: group(rows, 'region'),
    segments: group(rows, 'customerSegment'),
    topProducts: group(rows, 'productName').slice(0, 5),
  };
}
export function productMetrics(filters: Filters): ProductMetrics[] {
  const rows = filterSales(filters);
  const previous = previousPeriod(filters);
  const oldRows = filterSales(previous);
  const total = revenue(rows);
  return products
    .filter(
      (product) =>
        (!filters.category || product.category === filters.category) &&
        (!filters.productId || product.id === filters.productId),
    )
    .map((product) => {
      const matches = rows.filter((row) => row.productId === product.id);
      const value = revenue(matches);
      const previousRevenue =
        previous.startDate < dataRange.startDate
          ? null
          : revenue(oldRows.filter((row) => row.productId === product.id));
      return {
        ...product,
        revenue: value,
        unitsSold: matches.reduce((sum, row) => sum + row.unitsSold, 0),
        previousRevenue,
        growth: previousRevenue === null ? null : growth(value, previousRevenue),
        share: total ? (value / total) * 100 : 0,
        trend: trend(matches, filters),
      };
    });
}
