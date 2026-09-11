import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { Chart as ChartInstance, ChartType } from 'chart.js';
import type { SeriesPoint } from '../../models/analytics';
import { MetricPipe } from '../../pipes/metric.pipe';
@Component({
  selector: 'app-chart',
  imports: [MetricPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (error()) {
      <p class="error" role="alert">{{ error() }} Exact values remain below.</p>
    }
    <div class="chart">
      <canvas
        #canvas
        role="img"
        [attr.aria-label]="
          title() + '. Expand chart data for values and keyboard-accessible actions.'
        "
      ></canvas>
    </div>
    <details>
      <summary>View chart data{{ drillable() ? ' and explore records' : '' }}</summary>
      <ul>
        @for (point of points(); track point.label; let index = $index) {
          <li>
            <div>
              @if (drillable()) {
                <button type="button" (click)="pointSelect.emit(point)">{{ point.label }} →</button>
              } @else {
                <span>{{ point.label }}</span>
              }
              <strong>{{ point.value | metric: 'money' }}</strong>
            </div>
            @for (series of comparisons(); track series.label) {
              <small
                >{{ series.label }}:
                {{ series.points.at(index)?.value ?? 0 | metric: 'money' }}</small
              >
            }
          </li>
        } @empty {
          <li>No data for this selection.</li>
        }
      </ul>
    </details>`,
  styleUrl: './chart.scss',
})
export class Chart {
  readonly error = signal('');
  readonly points = input.required<SeriesPoint[]>();
  readonly title = input.required<string>();
  readonly type = input<ChartType>('bar');
  readonly horizontal = input(false);
  readonly drillable = input(false);
  readonly seriesLabel = input('Current period');
  readonly comparisons = input<{ label: string; points: SeriesPoint[] }[]>([]);
  readonly pointSelect = output<SeriesPoint>();
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  constructor() {
    effect((onCleanup) => {
      const canvas = this.canvas()?.nativeElement;
      const points = this.points();
      const type = this.type();
      const horizontal = this.horizontal();
      const comparisons = this.comparisons();
      const seriesLabel = this.seriesLabel();
      const drillable = this.drillable();
      let disposed = false;
      let instance: ChartInstance | undefined;
      onCleanup(() => {
        disposed = true;
        instance?.destroy();
      });
      if (!canvas) return;
      this.error.set('');
      void import('chart.js/auto')
        .then(({ default: ChartJs }) => {
          if (disposed) return;
          const palette = ['#157c69', '#789abe', '#bd964d', '#93bba3', '#8c77a5'];
          instance = new ChartJs(canvas, {
            type,
            data: {
              labels: points.map((p) => p.label),
              datasets: [
                {
                  label: seriesLabel,
                  data: points.map((p) => p.value),
                  borderColor: type === 'line' ? palette[0] : '#ffffff',
                  backgroundColor:
                    type === 'line'
                      ? '#157c6914'
                      : points.map((_, i) => palette[i % palette.length]),
                  borderWidth: type === 'line' ? 2.5 : 2,
                  fill: type === 'line' && !comparisons.length,
                  tension: 0.25,
                  pointRadius: type === 'line' ? 3 : 0,
                },
                ...comparisons.map((series, index) => ({
                  label: series.label,
                  data: series.points.map((p) => p.value),
                  borderColor: palette[(index + 1) % palette.length],
                  backgroundColor: palette[(index + 1) % palette.length],
                  borderWidth: 2,
                  fill: false,
                  tension: 0.25,
                  pointRadius: 2,
                  borderDash: comparisons.length === 1 ? [5, 4] : [],
                })),
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              indexAxis: horizontal ? 'y' : 'x',
              onClick: (_event, elements) => {
                const point = points[elements[0]?.index];
                if (drillable && point) this.pointSelect.emit(point);
              },
              plugins: {
                legend: {
                  display: type === 'doughnut' || comparisons.length > 0,
                  position: 'bottom',
                  labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 }, padding: 16 },
                },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      context.dataset.label +
                      ': ' +
                      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                        Number(context.raw),
                      ),
                  },
                },
              },
              ...(type === 'doughnut'
                ? { cutout: '70%' }
                : {
                    scales: {
                      x: {
                        grid: { display: horizontal },
                        border: { display: false },
                        ticks: {
                          color: '#526158',
                          font: { size: 11 },
                          ...(horizontal
                            ? {
                                callback: (value: string | number) =>
                                  '$' + Number(value) / 1000 + 'k',
                              }
                            : {}),
                        },
                      },
                      y: {
                        beginAtZero: true,
                        border: { display: false },
                        grid: { color: '#e7ede7', display: !horizontal },
                        ticks: {
                          color: '#526158',
                          font: { size: 11 },
                          ...(!horizontal
                            ? {
                                callback: (value: string | number) =>
                                  '$' + Number(value) / 1000 + 'k',
                              }
                            : {}),
                        },
                      },
                    },
                  }),
            },
          });
        })
        .catch(() => {
          if (!disposed) this.error.set('Chart could not be rendered.');
        });
    });
  }
}
