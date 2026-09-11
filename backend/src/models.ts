export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
}
export interface Sale {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  category: string;
  retailer: string;
  region: string;
  customerSegment: string;
  date: string;
  unitsSold: number;
  revenue: number;
}
export interface Filters {
  startDate: string;
  endDate: string;
  category?: string;
  region?: string;
  retailer?: string;
  customerSegment?: string;
  productId?: string;
}
export interface SeriesPoint {
  id?: string;
  label: string;
  value: number;
}
export interface ProductMetrics extends Product {
  trend: SeriesPoint[];
  previousRevenue: number | null;
  revenue: number;
  unitsSold: number;
  growth: number | null;
  share: number;
}
