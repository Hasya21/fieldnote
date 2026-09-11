import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap } from 'rxjs';

import type { Session } from '../../shared/models/contracts';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly signedIn = computed(() => this.session() !== null);
  private expiryTimer?: ReturnType<typeof setTimeout>;
  token(): string | null {
    const session = this.session();
    if (session && session.expiresAt <= Date.now()) {
      this.logout();
      return null;
    }
    return session?.token ?? null;
  }
  login(email: string, password: string) {
    return this.startSession('/api/auth/login', { email, password });
  }
  config() {
    return this.http.get<unknown>('/api/auth/config').pipe(
      switchMap(async (value) => {
        const { configSchema, validateResponse } = await import('../../shared/models/contracts');
        return validateResponse(configSchema, value);
      }),
    );
  }
  guest() {
    return this.startSession('/api/auth/demo', {});
  }
  private startSession(path: string, body: object) {
    return this.http.post<unknown>(path, body).pipe(
      switchMap(async (value) => {
        const { sessionSchema, validateResponse } = await import('../../shared/models/contracts');
        return validateResponse(sessionSchema, value);
      }),
      tap((session) => {
        this.logout();
        this.session.set(session);
        this.expiryTimer = setTimeout(
          () => this.logout(),
          Math.max(0, session.expiresAt - Date.now()),
        );
      }),
    );
  }
  logout() {
    clearTimeout(this.expiryTimer);
    this.session.set(null);
  }
}
