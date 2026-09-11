import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import type { Column, TableQuery, TableRow, SeriesPoint } from '../../models/analytics';
import { formatMetric } from '../../pipes/metric.pipe';
import { Sparkline } from '../sparkline/sparkline';
@Component({
  selector: 'app-data-table',
  imports: [ReactiveFormsModule, Sparkline],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable {
  readonly rows = input.required<TableRow[]>();
  readonly columns = input.required<Column[]>();
  readonly total = input(0);
  readonly query = input.required<TableQuery>();
  readonly loading = input(false);
  readonly error = input('');
  readonly selectable = input(false);
  readonly selectedId = input<string | null>(null);
  readonly compareEnabled = input(false);
  readonly comparedIds = input<string[]>([]);
  readonly compareToggle = output<string>();
  readonly caption = input('Results');
  readonly searchLabel = input('Search products');
  readonly searchPlaceholder = input('Search by product name…');
  readonly queryChange = output<TableQuery>();
  readonly selectRow = output<string>();
  readonly retry = output<void>();
  readonly search = new FormControl('', { nonNullable: true });
  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.query().pageSize)));
  constructor() {
    effect(() => this.search.setValue(this.query().search, { emitEvent: false }));
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.queryChange.emit({ ...this.query(), search, page: 1 }));
  }
  clearSearch() {
    this.search.setValue('', { emitEvent: false });
    this.queryChange.emit({ ...this.query(), search: '', page: 1 });
  }
  sort(key: string) {
    const query = this.query();
    this.queryChange.emit({
      ...query,
      sort: key,
      direction: query.sort === key && query.direction === 'desc' ? 'asc' : 'desc',
      page: 1,
    });
  }
  page(delta: number) {
    const page = this.query().page + delta;
    if (page >= 1 && page <= this.pages()) this.queryChange.emit({ ...this.query(), page });
  }
  cell(row: TableRow, column: Column) {
    const value = row[column.key];
    return typeof value === 'number' || value === null
      ? formatMetric(value, column.format)
      : typeof value === 'string'
        ? value
        : '';
  }
  points(row: TableRow, column: Column): SeriesPoint[] {
    const value = row[column.key];
    return Array.isArray(value) ? value : [];
  }
  direction(value: TableRow[string]) {
    return typeof value !== 'number' || value === 0
      ? 'neutral'
      : value > 0
        ? 'positive'
        : 'negative';
  }
  changeLabel(value: TableRow[string]) {
    return value === null
      ? 'No comparable baseline'
      : typeof value === 'number' && value < 0
        ? 'Decline'
        : typeof value === 'number' && value > 0
          ? 'Growth'
          : 'No change';
  }
}
