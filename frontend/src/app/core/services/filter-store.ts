import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { DEFAULT_FILTERS, type Filters, type TableQuery } from '../../shared/models/analytics';
const equals = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const dimensions = {
  category: ['Beverages', 'Pantry', 'Personal care', 'Household'],
  region: ['North', 'South', 'East', 'West'],
  retailer: ['Market Square', 'Daily Basket', 'Fresh Collective'],
  customerSegment: ['Value seekers', 'Everyday families', 'Premium shoppers'],
};
export function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function parseFilters(params: Record<string, string>): {
  filters: Filters;
  invalid: boolean;
} {
  const filters = { ...DEFAULT_FILTERS };
  let invalid = false;
  for (const key of ['startDate', 'endDate'] as const)
    if (params[key]) {
      if (validDate(params[key]) && params[key] >= '2024-01-01' && params[key] <= '2025-12-31')
        filters[key] = params[key];
      else invalid = true;
    }
  if (filters.startDate > filters.endDate) {
    filters.startDate = DEFAULT_FILTERS.startDate;
    filters.endDate = DEFAULT_FILTERS.endDate;
    invalid = true;
  }
  for (const key of Object.keys(dimensions) as (keyof typeof dimensions)[])
    if (params[key]) {
      if (dimensions[key].includes(params[key])) filters[key] = params[key];
      else invalid = true;
    }
  if (params['productId']) {
    if (/^p(0[1-9]|1[0-6])$/.test(params['productId'])) filters.productId = params['productId'];
    else invalid = true;
  }
  return { filters, invalid };
}
@Injectable({ providedIn: 'root' })
export class FilterStore {
  private readonly router = inject(Router, { optional: true });
  readonly filters = signal<Filters>({ ...DEFAULT_FILTERS }, { equal: equals });
  readonly query = signal<TableQuery>(
    { search: '', page: 1, pageSize: 8, sort: 'revenue', direction: 'desc', view: 'revenue' },
    { equal: equals },
  );
  readonly comparisonIds = signal<string[]>([], { equal: equals });
  readonly notice = signal('');
  constructor() {
    this.read();
    this.router?.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.read());
  }
  private read() {
    if (!this.router || this.router.url.startsWith('/login')) return;
    const tree = this.router.parseUrl(this.router.url);
    const params = Object.fromEntries(
      Object.entries(tree.queryParams).map(([key, value]) => [key, String(value)]),
    );
    const result = parseFilters(params);
    this.filters.set(result.filters);
    this.notice.set(result.invalid ? 'Some URL filters were invalid and have been reset.' : '');
    const sales = this.router.url.split('?')[0] === '/analytics';
    const sorts = sales
      ? ['date', 'orderId', 'productName', 'retailer', 'unitsSold', 'revenue']
      : ['name', 'category', 'revenue', 'unitsSold', 'growth', 'share'];
    const integer = (key: string, fallback: number, max: number) =>
      /^\d+$/.test(params[key] ?? '') && Number(params[key]) >= 1 && Number(params[key]) <= max
        ? Number(params[key])
        : fallback;
    this.query.set({
      search: (params['search'] ?? '').slice(0, 100),
      page: integer('page', 1, 100000),
      pageSize: integer('pageSize', sales ? 10 : 8, 100),
      sort: sorts.includes(params['sort']) ? params['sort'] : sales ? 'date' : 'revenue',
      direction: params['direction'] === 'asc' ? 'asc' : 'desc',
      view:
        params['view'] === 'growth' || params['view'] === 'declining' ? params['view'] : 'revenue',
    });
    this.comparisonIds.set(
      [
        ...new Set(
          (params['compare'] ?? '').split(',').filter((id) => /^p(0[1-9]|1[0-6])$/.test(id)),
        ),
      ].slice(0, 3),
    );
  }
  filterParams(filters = this.filters()) {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
  }
  private write() {
    if (this.router)
      void this.router.navigate([], {
        queryParams: {
          ...this.filterParams(),
          ...this.query(),
          compare: this.comparisonIds().length ? this.comparisonIds().join(',') : null,
        },
      });
  }
  set(filters: Filters) {
    this.filters.set(filters);
    this.query.update((query) => ({ ...query, page: 1 }));
    this.write();
  }
  setQuery(query: TableQuery) {
    this.query.set(query);
    this.write();
  }
  compare(ids: string[]) {
    this.comparisonIds.set(ids.slice(0, 3));
    this.write();
  }
  drill(dimension: keyof Filters | 'search', value: string) {
    const filters =
      dimension === 'search' ? this.filters() : { ...this.filters(), [dimension]: value };
    if (this.router)
      void this.router.navigate(['/analytics'], {
        queryParams: {
          ...this.filterParams(filters),
          ...(dimension === 'search' ? { search: value } : {}),
        },
      });
  }
}
