import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template:
    '<section class="panel"><div class="eyebrow">404</div><h1>Page not found</h1><p>This page is not part of your workspace.</p><a routerLink="/dashboard">Return to overview</a></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
