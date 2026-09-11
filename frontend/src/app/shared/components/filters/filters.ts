import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, type AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { FilterStore, validDate } from '../../../core/services/filter-store';
import {
  DEFAULT_FILTERS,
  type Options,
  type Filters as FilterValues,
} from '../../models/analytics';
@Component({
  selector: 'app-filters',
  imports: [ReactiveFormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Filters {
  private readonly api = inject(ApiService);
  readonly store = inject(FilterStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly options = signal<Options | null>(null);
  readonly error = signal('');
  readonly presets = [
    { label: 'Last 90 sample days', startDate: '2025-10-03', endDate: '2025-12-31' },
    { label: 'H2 2025', startDate: '2025-07-01', endDate: '2025-12-31' },
    { label: 'Full year 2025', startDate: '2025-01-01', endDate: '2025-12-31' },
    { label: 'All sample data', startDate: '2024-01-01', endDate: '2025-12-31' },
  ];
  readonly form = inject(FormBuilder).nonNullable.group(this.store.filters(), {
    validators: (control: AbstractControl) => {
      const start = control.get('startDate')?.value as string;
      const end = control.get('endDate')?.value as string;
      return !validDate(start) ||
        !validDate(end) ||
        start > end ||
        start < '2024-01-01' ||
        end > '2025-12-31'
        ? { dateRange: true }
        : null;
    },
  });
  readonly chips = computed(() => {
    const labels: Partial<Record<keyof FilterValues, string>> = {
      category: 'Category',
      region: 'Region',
      retailer: 'Retailer',
      customerSegment: 'Segment',
      productId: 'Product',
    };
    return (Object.keys(labels) as (keyof FilterValues)[]).flatMap((key) => {
      const value = this.store.filters()[key];
      return value
        ? [
            {
              key,
              label:
                labels[key] +
                ': ' +
                (key === 'productId'
                  ? (this.options()?.products.find((p) => p.id === value)?.name ?? value)
                  : value),
            },
          ]
        : [];
    });
  });
  constructor() {
    this.loadOptions();
    effect(() => this.form.patchValue(this.store.filters(), { emitEvent: false }));
    this.form.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.form.valid) this.store.set(this.form.getRawValue());
      });
  }
  loadOptions() {
    this.error.set('');
    this.api
      .options()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => this.options.set(options),
        error: (error: Error) => this.error.set(error.message),
      });
  }
  reset() {
    this.form.reset({ ...DEFAULT_FILTERS });
  }
  remove(key: keyof FilterValues) {
    this.form.patchValue({ [key]: '' });
  }
  preset(value: { startDate: string; endDate: string }) {
    this.form.patchValue(value);
  }
}
