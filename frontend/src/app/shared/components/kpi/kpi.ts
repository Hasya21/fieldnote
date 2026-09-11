import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MetricPipe } from '../../pipes/metric.pipe';
@Component({
  selector: 'app-kpi',
  imports: [MetricPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article>
    <p>{{ label() }}</p>
    <strong>{{ value() | metric: format() }}</strong>
    @if (previous() !== null) {
      <div class="prior">Prior: {{ previous() | metric: format() }}</div>
    }
    @if (change() !== null) {
      <span
        class="change"
        [class.positive]="change()! > 0"
        [class.negative]="change()! < 0"
        [class.neutral]="change() === 0"
        >{{ change()! > 0 ? '↑ Growth' : change()! < 0 ? '↓ Decline' : '— No change' }}
        {{ change() | metric: 'growth' }}</span
      >
    }
    <small>{{ note() }}</small>
  </article>`,
  styleUrl: './kpi.scss',
})
export class Kpi {
  readonly label = input.required<string>();
  readonly value = input.required<number | null>();
  readonly format = input('number');
  readonly note = input('');
  readonly previous = input<number | null>(null);
  readonly change = computed(() => {
    const previous = this.previous();
    const value = this.value();
    return previous === null || previous === 0 || value === null
      ? null
      : ((value - previous) / previous) * 100;
  });
}
