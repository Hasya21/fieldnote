export type { Dashboard, SeriesPoint, Product, ProductDetail, Sale, Options } from './contracts';
import type { SeriesPoint } from './contracts';
export interface Filters {
  startDate: string;
  endDate: string;
  category: string;
  region: string;
  retailer: string;
  customerSegment: string;
  productId: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface TableQuery {
  search: string;
  page: number;
  pageSize: number;
  sort: string;
  direction: 'asc' | 'desc';
  view?: 'revenue' | 'growth' | 'declining';
}
export interface Column {
  key: string;
  label: string;
  format?: 'currency' | 'money' | 'number' | 'percent' | 'growth' | 'trend';
}
export interface TableRow {
  id: string;
  [key: string]: string | number | null | SeriesPoint[];
}
export const DEFAULT_FILTERS: Filters = {
  startDate: '2025-07-01',
  endDate: '2025-12-31',
  category: '',
  region: '',
  retailer: '',
  customerSegment: '',
  productId: '',
};
