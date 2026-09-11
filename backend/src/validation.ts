import { z } from 'zod';
import {
  categories,
  regions,
  retailers,
  segments,
  defaultRange,
  dataRange,
  products,
} from './data.js';
const choice = (values: string[]) =>
  z
    .string()
    .refine((value) => values.includes(value), 'Unknown filter value')
    .optional();
export const querySchema = z
  .object({
    startDate: z.iso.date().default(defaultRange.startDate),
    endDate: z.iso.date().default(defaultRange.endDate),
    category: choice(categories),
    region: choice(regions),
    retailer: choice(retailers),
    customerSegment: choice(segments),
    productId: choice(products.map((product) => product.id)),
    ids: z
      .string()
      .transform((value) => value.split(','))
      .refine(
        (ids) =>
          ids.length >= 2 &&
          ids.length <= 3 &&
          new Set(ids).size === ids.length &&
          ids.every((id) => products.some((p) => p.id === id)),
        'Choose two or three distinct products.',
      )
      .optional(),
    view: z.enum(['revenue', 'growth', 'declining']).default('revenue'),
    search: z.string().trim().max(100).default(''),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    sort: z
      .enum([
        'name',
        'category',
        'revenue',
        'unitsSold',
        'growth',
        'share',
        'date',
        'orderId',
        'productName',
        'region',
        'retailer',
        'customerSegment',
      ])
      .default('revenue'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.startDate > value.endDate)
      context.addIssue({ code: 'custom', message: 'Start date must be before end date.' });
    if (value.startDate < dataRange.startDate || value.endDate > dataRange.endDate)
      context.addIssue({
        code: 'custom',
        message: 'Choose dates within the sample dataset (2024–2025).',
      });
  });
export type Query = z.infer<typeof querySchema>;
export function paginate<T>(items: T[], query: Query) {
  const pages = Math.max(1, Math.ceil(items.length / query.pageSize));
  const page = Math.min(query.page, pages);
  return {
    items: items.slice((page - 1) * query.pageSize, page * query.pageSize),
    total: items.length,
    page,
    pageSize: query.pageSize,
  };
}
export function sortRows<T extends object>(
  rows: T[],
  key: keyof T,
  direction: 'asc' | 'desc',
): T[] {
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (left == null) return right == null ? 0 : 1;
    if (right == null) return -1;
    const result =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'en', { numeric: true });
    return direction === 'asc' ? result : -result;
  });
}
