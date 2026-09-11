import { z } from 'zod';
const number = z.number().finite();
export const pointSchema = z.object({
  label: z.string(),
  value: number,
  id: z.string().optional(),
});
const metricsSchema = z.object({
  revenue: number,
  unitsSold: number,
  orders: number,
  averageOrderValue: number,
  categoryShare: number,
});
const periodSchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  category: z.string().optional(),
  region: z.string().optional(),
  retailer: z.string().optional(),
  customerSegment: z.string().optional(),
  productId: z.string().optional(),
});
export const insightSchema = z.object({
  dimension: z.enum(['category', 'region']),
  label: z.string(),
  current: number,
  previous: number,
  delta: number,
  growth: number.nullable(),
});
export const dashboardSchema = metricsSchema.extend({
  growth: number.nullable(),
  records: number.int().nonnegative(),
  previousPeriod: periodSchema,
  previous: metricsSchema.nullable(),
  comparisonReason: z.string().nullable(),
  previousTrend: z.array(pointSchema),
  insights: z.array(insightSchema),
  trend: z.array(pointSchema),
  categories: z.array(pointSchema),
  regions: z.array(pointSchema),
  segments: z.array(pointSchema),
  topProducts: z.array(pointSchema),
});
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: number,
  description: z.string(),
  revenue: number,
  unitsSold: number,
  growth: number.nullable(),
  share: number,
  previousRevenue: number.nullable(),
  trend: z.array(pointSchema),
});
export const saleSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  category: z.string(),
  retailer: z.string(),
  region: z.string(),
  customerSegment: z.string(),
  date: z.iso.date(),
  unitsSold: number.int().positive(),
  revenue: number.nonnegative(),
});
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: number.int().nonnegative(),
    page: number.int().positive(),
    pageSize: number.int().positive(),
  });
}
export const optionsSchema = z.object({
  categories: z.array(z.string()),
  regions: z.array(z.string()),
  retailers: z.array(z.string()),
  segments: z.array(z.string()),
  products: z.array(z.object({ id: z.string(), name: z.string() })),
  dataRange: z.object({ startDate: z.iso.date(), endDate: z.iso.date() }),
  defaultRange: z.object({ startDate: z.iso.date(), endDate: z.iso.date() }),
});
export const sessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: number,
  user: z.object({ name: z.string(), email: z.email() }),
});
export function validateResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      'The service returned an incompatible response. Please retry or contact the maintainer.',
    );
  return result.data;
}
export type SeriesPoint = z.infer<typeof pointSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductDetail = Product;
export type Sale = z.infer<typeof saleSchema>;
export type Options = z.infer<typeof optionsSchema>;
export type Session = z.infer<typeof sessionSchema>;
export const configSchema = z.object({
  demoAccess: z.boolean(),
  passwordLogin: z.boolean().default(true),
});
