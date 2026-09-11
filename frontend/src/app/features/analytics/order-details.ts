import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FilterStore } from '../../core/services/filter-store';
import type { Sale } from '../../shared/models/analytics';
@Component({
  selector: 'app-order-details',
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h3>{{ sale().orderId }}</h3>
    <p class="date">{{ sale().date }}</p>
    <div class="amount">{{ sale().revenue | currency: 'USD' }}</div>
    <p class="muted">Recorded sale amount</p>
    <dl>
      <dt>Product</dt>
      <dd>{{ sale().productName }}</dd>
      <dt>Category</dt>
      <dd>{{ sale().category }}</dd>
      <dt>Retailer</dt>
      <dd>{{ sale().retailer }}</dd>
      <dt>Region</dt>
      <dd>{{ sale().region }}</dd>
      <dt>Customer segment</dt>
      <dd>{{ sale().customerSegment }}</dd>
      <dt>Quantity</dt>
      <dd>{{ sale().unitsSold | number }} units</dd>
      <dt>Realized unit price</dt>
      <dd>{{ sale().revenue / sale().unitsSold | currency: 'USD' }}</dd>
    </dl>
    <a [routerLink]="['/products', sale().productId]" [queryParams]="store.filterParams()"
      >View product performance →</a
    >
    <p class="note">One fictional product line. Unit price includes generated price variation.</p>`,
  styles: `
    h3 {
      font-size: 21px;
      margin: 18px 0 6px;
    }
    .date,
    .muted {
      font-size: 12px;
      color: var(--muted);
    }
    .amount {
      font-size: 32px;
      font-weight: 600;
      margin-top: 24px;
      letter-spacing: -1px;
    }
    dl {
      margin: 24px 0;
    }
    dt {
      font-size: 12px;
      color: var(--muted);
      margin-top: 14px;
    }
    dd {
      font-size: 13px;
      margin: 5px 0 0;
      line-height: 1.5;
    }
    a {
      display: block;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      margin-top: 24px;
    }
    .note {
      border-top: 1px solid var(--border);
      padding-top: 18px;
      margin-top: 20px;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.7;
    }
    @media (max-width: 800px) {
      dl {
        display: grid;
        grid-template-columns: 130px 1fr;
        gap: 12px;
      }
      dt,
      dd {
        margin: 0;
      }
    }
  `,
})
export class OrderDetails {
  readonly sale = input.required<Sale>();
  readonly store = inject(FilterStore);
}
