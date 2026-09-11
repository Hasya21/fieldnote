import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly demoAccess = signal(false);
  readonly passwordLogin = signal(true);
  constructor() {
    this.auth
      .config()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.demoAccess.set(config.demoAccess);
          this.passwordLogin.set(config.passwordLogin);
        },
        error: () => {},
      });
  }
  guest() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth
      .guest()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => this.navigate(),
        error: (error: Error) => this.error.set(error.message),
      });
  }
  private navigate() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    void this.router.navigateByUrl(
      /^\/(dashboard|products|analytics)(\/|\?|$)/.test(returnUrl) ? returnUrl : '/dashboard',
    );
  }
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.maxLength(256)]],
  });
  submit() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth
      .login(email, password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          const safeUrl = /^\/(dashboard|products|analytics)(\/|\?|$)/.test(returnUrl)
            ? returnUrl
            : '/dashboard';
          void this.router.navigateByUrl(safeUrl);
        },
        error: (error: Error) => this.error.set(error.message),
      });
  }
}
