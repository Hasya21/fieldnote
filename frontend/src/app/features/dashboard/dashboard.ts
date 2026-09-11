import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { FilterStore } from '../../core/services/filter-store';
import { loadState } from '../../core/services/load-state';
import { Filters } from '../../shared/components/filters/filters';
import { Kpi } from '../../shared/components/kpi/kpi';
import { Chart } from '../../shared/components/chart/chart';
import { MetricPipe } from '../../shared/pipes/metric.pipe';
import type { SeriesPoint } from '../../shared/models/analytics';
@Component({
  selector: 'app-dashboard',
  imports: [Filters, Kpi, Chart, MetricPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly api = inject(ApiService);
  readonly store = inject(FilterStore);
  readonly filters = this.store.filters;
  readonly refresh = signal(0);
  readonly state = toSignal(
    combineLatest([toObservable(this.filters), toObservable(this.refresh)]).pipe(
      switchMap(([filters]) => loadState(this.api.dashboard(filters))),
    ),
    { initialValue: { data: null, loading: true, error: '' } },
  );
  readonly comparison = computed(() =>
    this.state().data?.previousTrend.length
      ? [{ label: 'Previous period (aligned)', points: this.state().data!.previousTrend }]
      : [],
  );
  reload() {
    this.refresh.update((value) => value + 1);
  }
  product(point: SeriesPoint) {
    this.store.drill(point.id ? 'productId' : 'search', point.id ?? point.label);
  }
}
