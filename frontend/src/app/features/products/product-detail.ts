import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { FilterStore } from '../../core/services/filter-store';
import { loadState } from '../../core/services/load-state';
import { Chart } from '../../shared/components/chart/chart';
import { Kpi } from '../../shared/components/kpi/kpi';
@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, Chart, Kpi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <a class="back-link" routerLink="/products" [queryParams]="store.filterParams()"
      >← Back to products</a
    >
    @if (state().loading) {
      <div class="panel" role="status">Loading product details…</div>
    } @else if (state().error) {
      <div class="panel error" role="alert">
        <h1>Product unavailable</h1>
        <p>{{ state().error }}</p>
        <button class="button" (click)="reload()">Try again</button>
      </div>
    } @else if (state().data; as product) {
      <section class="page-heading">
        <div>
          <div class="eyebrow">{{ product.category }}</div>
          <h1>{{ product.name }}</h1>
          <p>{{ product.description }}</p>
        </div>
        <span class="badge">{{ product.id.toUpperCase() }}</span>
      </section>
      <p class="footnote">
        Period: {{ filters().startDate }} – {{ filters().endDate }} ·
        {{ filters().region || 'All regions' }} · {{ filters().retailer || 'All retailers' }} ·
        {{ filters().customerSegment || 'All segments' }}. Category filter does not restrict this
        product’s detail.
      </p>
      <div class="detail-kpis">
        <app-kpi
          label="Revenue"
          [previous]="product.previousRevenue"
          [value]="product.revenue"
          format="currency"
        /><app-kpi label="Units sold" [value]="product.unitsSold" /><app-kpi
          label="Revenue growth"
          [value]="product.growth"
          format="growth"
          note="vs. previous equal-length period"
        /><app-kpi
          label="Selection share"
          [value]="product.share"
          format="percent"
          note="Across all categories in this selection"
        />
      </div>
      <article class="panel">
        <header>
          <div>
            <h2>Product revenue trend</h2>
            <p>Monthly revenue · USD</p>
          </div>
        </header>
        <app-chart [title]="product.name + ' revenue trend'" [points]="product.trend" type="line" />
      </article>
    }`,
  styles:
    '.detail-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin:24px 0; } @media(max-width:700px) { .detail-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } }',
})
export class ProductDetail {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(FilterStore);
  readonly filters = this.store.filters;
  private readonly refresh = signal(0);
  readonly state = toSignal(
    combineLatest([
      this.route.paramMap,
      toObservable(this.filters),
      toObservable(this.refresh),
    ]).pipe(
      switchMap(([params, filters]) =>
        loadState(this.api.product(params.get('id') ?? '', filters)),
      ),
    ),
    { initialValue: { data: null, loading: true, error: '' } },
  );
  reload() {
    this.refresh.update((value) => value + 1);
  }
}
