import { Pipe, type PipeTransform } from '@angular/core';
export function formatMetric(value: number | null, format = 'number'): string {
  if (value === null) return '—';
  if (format === 'money')
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  if (format === 'currency')
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  if (format === 'percent' || format === 'growth')
    return (format === 'growth' && value > 0 ? '+' : '') + value.toFixed(1) + '%';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}
@Pipe({ name: 'metric' })
export class MetricPipe implements PipeTransform {
  transform(value: number | null, format = 'number'): string {
    return formatMetric(value, format);
  }
}
