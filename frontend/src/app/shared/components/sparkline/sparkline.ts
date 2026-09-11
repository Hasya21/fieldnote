import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SeriesPoint } from '../../models/analytics';
@Component({
  selector: 'app-sparkline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<svg viewBox="0 0 100 32" role="img" [attr.aria-label]="description()"><polyline [attr.points]="coordinates()" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" /></svg>',
  styles:
    ':host { display:block; width:100px; color:var(--accent); } svg { display:block; width:100%; height:32px; }',
})
export class Sparkline {
  readonly points = input.required<SeriesPoint[]>();
  readonly description = computed(() =>
    this.points().length
      ? 'Monthly revenue: ' +
        this.points()
          .map((point) => point.label + ' $' + point.value.toFixed(2))
          .join(', ')
      : 'No trend data',
  );
  readonly coordinates = computed(() => {
    const values = this.points().map((point) => point.value);
    const min = Math.min(...values);
    const range = Math.max(...values) - min;
    return values
      .map(
        (value, index) =>
          (values.length === 1 ? 50 : (index / (values.length - 1)) * 96 + 2) +
          ',' +
          (range ? 28 - ((value - min) / range) * 24 : 16),
      )
      .join(' ');
  });
}
