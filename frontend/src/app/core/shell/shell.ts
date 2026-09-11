import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FilterStore } from '../services/filter-store';
import { AuthService } from '../auth/auth.service';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly store = inject(FilterStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);
  private signingOut = false;
  constructor() {
    effect(() => {
      if (!this.auth.signedIn() && !this.signingOut && !this.router.url.startsWith('/login'))
        void this.router.navigate(['/login'], {
          queryParams: { expired: 'true', returnUrl: this.router.url },
        });
    });
  }
  logout() {
    this.signingOut = true;
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
  closeMenu() {
    this.menuOpen.set(false);
  }
}
