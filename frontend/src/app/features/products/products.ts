import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { FilterStore } from '../../core/services/filter-store';
import { loadState } from '../../core/services/load-state';
import { Filters } from '../../shared/components/filters/filters';
import { DataTable } from '../../shared/components/data-table/data-table';
import { Chart } from '../../shared/components/chart/chart';
import { MetricPipe } from '../../shared/pipes/metric.pipe';
import type { Column, TableRow, TableQuery } from '../../shared/models/analytics';
@Component({
  selector: 'app-products',
  imports: [Filters, DataTable, Chart, MetricPipe],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly store = inject(FilterStore);
  readonly filters = this.store.filters;
  readonly query = this.store.query;
  readonly comparedIds = this.store.comparisonIds;
  private readonly refresh = signal(0);
  readonly columns: Column[] = [
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'revenue', label: 'Revenue', format: 'currency' },
    { key: 'growth', label: 'Growth', format: 'growth' },
    { key: 'share', label: 'Contribution', format: 'percent' },
    { key: 'trend', label: 'Revenue trend', format: 'trend' },
  ];
  readonly state = toSignal(
    combineLatest([
      toObservable(this.filters),
      toObservable(this.query),
      toObservable(this.refresh),
    ]).pipe(switchMap(([filters, query]) => loadState(this.api.products(filters, query)))),
    { initialValue: { data: null, loading: true, error: '' } },
  );
  readonly comparison = toSignal(
    combineLatest([
      toObservable(this.comparedIds),
      toObservable(this.filters),
      toObservable(this.refresh),
    ]).pipe(
      switchMap(([ids, filters]) =>
        ids.length >= 2
          ? loadState(this.api.compare(ids, filters))
          : of({ data: [], loading: false, error: '' }),
      ),
    ),
    { initialValue: { data: null, loading: false, error: '' } },
  );
  readonly rows = computed<TableRow[]>(
    () => this.state().data?.items.map((item) => ({ ...item })) ?? [],
  );
  readonly displayQuery = computed(() => ({
    ...this.query(),
    page: this.state().data?.page ?? this.query().page,
  }));
  readonly additionalSeries = computed(
    () =>
      this.comparison()
        .data?.slice(1)
        .map((product) => ({ label: product.name, points: product.trend })) ?? [],
  );
  toggle(id: string) {
    const current = this.comparedIds();
    this.store.compare(
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }
  setView(view: NonNullable<TableQuery['view']>) {
    this.store.setQuery({
      ...this.query(),
      view,
      sort: view === 'revenue' ? 'revenue' : 'growth',
      direction: view === 'declining' ? 'asc' : 'desc',
      page: 1,
    });
  }
  open(id: string) {
    void this.router.navigate(['/products', id], { queryParams: this.store.filterParams() });
  }
  reload() {
    this.refresh.update((value) => value + 1);
  }
}
