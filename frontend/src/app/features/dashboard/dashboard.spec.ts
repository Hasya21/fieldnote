import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { ApiService } from '../../core/services/api.service';
import { Chart } from '../../shared/components/chart/chart';
import { Filters } from '../../shared/components/filters/filters';
import type { Dashboard as DashboardModel, SeriesPoint } from '../../shared/models/analytics';
@Component({ selector: 'app-chart', template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class ChartStub {
  readonly title = input('');
  readonly points = input<SeriesPoint[]>([]);
  readonly type = input('bar');
  readonly horizontal = input(false);
  readonly comparisons = input([]);
  readonly drillable = input(false);
  readonly seriesLabel = input('');
}
@Component({
  selector: 'app-filters',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FiltersStub {}
const fixtureData: DashboardModel = {
  previous: null,
  comparisonReason: null,
  previousTrend: [],
  insights: [
    {
      dimension: 'category',
      label: 'Pantry',
      current: 12345,
      previous: 10000,
      delta: 2345,
      growth: 23.45,
    },
  ],
  revenue: 12345,
  unitsSold: 500,
  orders: 100,
  averageOrderValue: 123.45,
  categoryShare: 100,
  growth: 12,
  records: 100,
  previousPeriod: {
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    category: '',
    region: '',
    retailer: '',
    customerSegment: '',
  },
  trend: [],
  categories: [{ label: 'Pantry', value: 12345 }],
  regions: [],
  segments: [],
  topProducts: [],
};
describe('Dashboard', () => {
  function setup(api: object) {
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    TestBed.overrideComponent(Dashboard, {
      remove: { imports: [Chart, Filters] },
      add: { imports: [ChartStub, FiltersStub] },
    });
    return TestBed.createComponent(Dashboard);
  }
  it('transitions from loading to API-backed KPI cards', async () => {
    const response = new Subject<DashboardModel>();
    const fixture = setup({ dashboard: () => response });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Preparing your insights');
    response.next(fixtureData);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('app-kpi')).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('$12,345');
    expect(fixture.nativeElement.textContent).toContain('Pantry');
  });
  it('shows a recoverable error and retries on request', async () => {
    const dashboard = jest.fn(() => throwError(() => new Error('API unavailable')));
    const fixture = setup({ dashboard });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'API unavailable',
    );
    fixture.componentInstance.reload();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dashboard).toHaveBeenCalledTimes(2);
  });
});
