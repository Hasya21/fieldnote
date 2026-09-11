import { inject } from '@angular/core';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = request.url.startsWith('/api/');
  const token = isApi ? auth.token() : null;
  const authenticated = token
    ? request.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
    : request;
  return next(authenticated).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !isApi) return throwError(() => error);
      if (error.status === 401 && !request.url.endsWith('/auth/login')) {
        auth.logout();
        void router.navigate(['/login'], {
          queryParams: { expired: 'true', returnUrl: router.url },
        });
      }
      const serverMessage: unknown = error.error?.message;
      const message =
        error.status === 0
          ? 'Cannot reach the API. Check that the backend is running.'
          : error.status === 403
            ? 'You do not have permission to view this data.'
            : error.status >= 500
              ? 'The analytics service is temporarily unavailable. Please retry.'
              : typeof serverMessage === 'string'
                ? serverMessage
                : 'Unable to complete the request. Please retry.';
      return throwError(() => new Error(message));
    }),
  );
};
