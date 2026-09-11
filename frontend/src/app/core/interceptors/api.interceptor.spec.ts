import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { apiInterceptor } from './api.interceptor';
describe('API interceptor', () => {
  const auth = { token: () => 'token', logout: jest.fn() };
  let client: HttpClient;
  let http: HttpTestingController;
  beforeEach(() => {
    auth.logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('attaches bearer tokens only to local API requests', () => {
    client.get('/api/dashboard').subscribe();
    const internal = http.expectOne('/api/dashboard');
    expect(internal.request.headers.get('Authorization')).toBe('Bearer token');
    internal.flush({});
    client.get('https://example.test/data').subscribe();
    const external = http.expectOne('https://example.test/data');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
  });
  it('clears unauthorized sessions and returns a useful forbidden error', () => {
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const error = jest.fn();
    client.get('/api/dashboard').subscribe({ error });
    http
      .expectOne('/api/dashboard')
      .flush({ message: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Session expired' }));
    client.get('/api/dashboard').subscribe({ error });
    http.expectOne('/api/dashboard').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(error).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'You do not have permission to view this data.' }),
    );
  });
});
