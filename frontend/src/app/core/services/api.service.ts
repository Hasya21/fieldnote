import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';
import { z } from 'zod';
import type { Filters, TableQuery } from '../../shared/models/analytics';
import {
  dashboardSchema,
  optionsSchema,
  pageSchema,
  productSchema,
  saleSchema,
  validateResponse,
} from '../../shared/models/contracts';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly optionsRequest = this.http.get<unknown>('/api/options').pipe(
    map((data) => validateResponse(optionsSchema, data)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  options() {
    return this.optionsRequest;
  }
  dashboard(filters: Filters) {
    return this.http
      .get<unknown>('/api/dashboard', { params: this.params(filters) })
      .pipe(map((data) => validateResponse(dashboardSchema, data)));
  }
  products(filters: Filters, query: TableQuery) {
    return this.http
      .get<unknown>('/api/products', { params: this.params({ ...filters, ...query }) })
      .pipe(map((data) => validateResponse(pageSchema(productSchema), data)));
  }
  product(id: string, filters: Filters) {
    return this.http
      .get<unknown>('/api/products/' + encodeURIComponent(id), { params: this.params(filters) })
      .pipe(map((data) => validateResponse(productSchema, data)));
  }
  compare(ids: string[], filters: Filters) {
    return this.http
      .get<unknown>('/api/compare', { params: this.params({ ...filters, ids: ids.join(',') }) })
      .pipe(map((data) => validateResponse(z.array(productSchema).min(2).max(3), data)));
  }
  sales(filters: Filters, query: TableQuery) {
    return this.http
      .get<unknown>('/api/sales', { params: this.params({ ...filters, ...query }) })
      .pipe(map((data) => validateResponse(pageSchema(saleSchema), data)));
  }
  exportSales(filters: Filters, query: TableQuery) {
    return this.http.get('/api/sales/export', {
      params: this.params({
        ...filters,
        search: query.search,
        sort: query.sort,
        direction: query.direction,
      }),
      responseType: 'blob',
    });
  }
  private params(values: object): HttpParams {
    return new HttpParams({
      fromObject: Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== '' && value !== null && value !== undefined,
        ),
      ),
    });
  }
}
