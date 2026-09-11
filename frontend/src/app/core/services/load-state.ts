import { catchError, map, of, startWith, type Observable } from 'rxjs';
export interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}
export function loadState<T>(request: Observable<T>): Observable<LoadState<T>> {
  return request.pipe(
    map((data) => ({ data, loading: false, error: '' })),
    startWith({ data: null, loading: true, error: '' }),
    catchError((error: Error) =>
      of({ data: null, loading: false, error: error.message || 'Unable to load data.' }),
    ),
  );
}
