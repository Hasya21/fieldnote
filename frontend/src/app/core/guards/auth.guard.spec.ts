import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';
it('protects routes and preserves the requested destination', () => {
  const token = jest.fn<() => string | null>().mockReturnValue(null);
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { token } }],
  });
  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/products/p01' } as RouterStateSnapshot),
    );
  expect((run() as UrlTree).toString()).toBe('/login?returnUrl=%2Fproducts%2Fp01');
  token.mockReturnValue('valid-token');
  expect(run()).toBe(true);
});
