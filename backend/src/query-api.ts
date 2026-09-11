import {
  categories,
  regions,
  retailers,
  segments,
  dataRange,
  defaultRange,
  products,
} from './data.js';
import { dashboard, filterSales, productMetrics } from './analytics.js';
import { querySchema, paginate, sortRows } from './validation.js';
import type { Sale, ProductMetrics } from './models.js';
export interface ApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}
export function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function salesCsv(rows: Sale[]): string {
  const columns = [
    'orderId',
    'date',
    'productId',
    'productName',
    'category',
    'retailer',
    'region',
    'customerSegment',
    'unitsSold',
    'revenue',
  ] as const;
  return (
    '\uFEFF' +
    [
      columns.join(','),
      ...rows.map((row) =>
        columns
          .map((key) => csvCell(key === 'revenue' ? row.revenue.toFixed(2) : row[key]))
          .join(','),
      ),
    ].join('\r\n')
  );
}
export function queryApi(path: string, rawQuery: unknown): ApiResult {
  const ok = (body: unknown): ApiResult => ({ status: 200, body });
  if (path === '/api/categories') return ok(categories);
  if (path === '/api/regions') return ok(regions);
  if (path === '/api/options')
    return ok({
      categories,
      regions,
      retailers,
      segments,
      dataRange,
      defaultRange,
      products: products.map(({ id, name }) => ({ id, name })),
    });
  const result = querySchema.safeParse(rawQuery);
  if (!result.success)
    return { status: 400, body: { message: result.error.issues[0]?.message ?? 'Invalid query.' } };
  const query = result.data;
  if (path === '/api/dashboard') return ok(dashboard(query));
  if (path === '/api/products') {
    if (!['name', 'category', 'revenue', 'unitsSold', 'growth', 'share'].includes(query.sort))
      return { status: 400, body: { message: 'Unsupported product sort field.' } };
    const rows = productMetrics(query).filter(
      (row) =>
        row.name.toLowerCase().includes(query.search.toLowerCase()) &&
        (query.view !== 'declining' || (row.growth !== null && row.growth < 0)),
    );
    return ok(paginate(sortRows(rows, query.sort as keyof ProductMetrics, query.direction), query));
  }
  if (path === '/api/compare') {
    if (!query.ids)
      return { status: 400, body: { message: 'Choose two or three distinct products.' } };
    const metrics = productMetrics({ ...query, category: undefined, productId: undefined });
    return ok(query.ids.map((id) => metrics.find((product) => product.id === id)));
  }
  if (path === '/api/sales' || path === '/api/sales/export') {
    if (
      ![
        'date',
        'orderId',
        'productName',
        'category',
        'region',
        'retailer',
        'customerSegment',
        'revenue',
        'unitsSold',
      ].includes(query.sort)
    )
      return { status: 400, body: { message: 'Unsupported sales sort field.' } };
    const rows = sortRows(
      filterSales(query).filter(
        (row) =>
          row.productName.toLowerCase().includes(query.search.toLowerCase()) ||
          row.orderId.toLowerCase().includes(query.search.toLowerCase()),
      ),
      query.sort as keyof Sale,
      query.direction,
    );
    if (path.endsWith('/export'))
      return {
        status: 200,
        body: salesCsv(rows),
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="fieldnote-sales-' +
            query.startDate +
            '-' +
            query.endDate +
            '.csv"',
        },
      };
    return ok(paginate(rows, query));
  }
  if (path.startsWith('/api/products/')) {
    const product = productMetrics({ ...query, category: undefined, productId: undefined }).find(
      (item) => item.id === decodeURIComponent(path.slice('/api/products/'.length)),
    );
    return product ? ok(product) : { status: 404, body: { message: 'Product not found.' } };
  }
  return { status: 404, body: { message: 'Endpoint not found.' } };
}
