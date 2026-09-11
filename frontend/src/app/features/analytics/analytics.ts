import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, finalize, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { FilterStore } from '../../core/services/filter-store';
import { loadState } from '../../core/services/load-state';
import { Filters } from '../../shared/components/filters/filters';
import { DataTable } from '../../shared/components/data-table/data-table';
import { OrderDetails } from './order-details';
import type { Column, TableRow } from '../../shared/models/analytics';
@Component({
  selector: 'app-analytics',
  imports: [Filters, DataTable, CurrencyPipe, DecimalPipe, RouterLink, OrderDetails],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Analytics {
  private readonly api = inject(ApiService);
  readonly store = inject(FilterStore);
  private readonly destroy = inject(DestroyRef);
  readonly filters = this.store.filters;
  readonly query = this.store.query;
  private readonly refresh = signal(0);
  readonly selectedId = signal<string | null>(null);
  readonly exporting = signal(false);
  readonly exportMessage = signal('');
  readonly exportError = signal('');
  readonly mobile = signal(false);
  readonly sheet = viewChild<ElementRef<HTMLDialogElement>>('sheet');
  readonly columns: Column[] = [
    { key: 'orderId', label: 'Order ID' },
    { key: 'date', label: 'Sale date' },
    { key: 'productName', label: 'Product' },
    { key: 'retailer', label: 'Retailer' },
    { key: 'unitsSold', label: 'Units', format: 'number' },
    { key: 'revenue', label: 'Sale amount', format: 'money' },
  ];
  readonly state = toSignal(
    combineLatest([
      toObservable(this.filters),
      toObservable(this.query),
      toObservable(this.refresh),
    ]).pipe(switchMap(([filters, query]) => loadState(this.api.sales(filters, query)))),
    { initialValue: { data: null, loading: true, error: '' } },
  );
  readonly rows = computed<TableRow[]>(
    () => this.state().data?.items.map((item) => ({ ...item })) ?? [],
  );
  readonly displayQuery = computed(() => ({
    ...this.query(),
    page: this.state().data?.page ?? this.query().page,
  }));
  readonly selected = computed(
    () => this.state().data?.items.find((item) => item.id === this.selectedId()) ?? null,
  );
  readonly pageRevenue = computed(
    () => this.state().data?.items.reduce((sum, item) => sum + item.revenue, 0) ?? 0,
  );
  readonly pageUnits = computed(
    () => this.state().data?.items.reduce((sum, item) => sum + item.unitsSold, 0) ?? 0,
  );
  constructor() {
    const media = window.matchMedia('(max-width: 800px)');
    this.mobile.set(media.matches);
    const listener = () => this.mobile.set(media.matches);
    media.addEventListener('change', listener);
    this.destroy.onDestroy(() => media.removeEventListener('change', listener));
    effect(() => {
      const dialog = this.sheet()?.nativeElement;
      const open = this.mobile() && this.selected() !== null;
      if (open && !dialog?.open) dialog?.showModal();
      else if (!open && dialog?.open) dialog.close();
    });
  }
  reload() {
    this.refresh.update((value) => value + 1);
  }
  closeSheet() {
    if (this.mobile()) this.selectedId.set(null);
  }
  export() {
    if (this.exporting() || !this.state().data?.total) return;
    this.exporting.set(true);
    this.exportMessage.set('Preparing all matching orders…');
    this.exportError.set('');
    const filters = { ...this.filters() };
    const query = { ...this.query() };
    this.api
      .exportSales(filters, query)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.exporting.set(false)),
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'fieldnote-sales-' + filters.startDate + '-' + filters.endDate + '.csv';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.exportMessage.set(
            'CSV downloaded: all orders matching the filters and search at export time.',
          );
        },
        error: (error: Error) => {
          this.exportMessage.set('');
          this.exportError.set(error.message);
        },
      });
  }
}
