import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';
describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    auth.logout();
  });
  it('holds a successful session in memory and clears it on logout', async () => {
    const result = firstValueFrom(auth.login('person@example.test', 'test-input'));
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      token: 'signed-token',
      expiresAt: Date.now() + 60000,
      user: { name: 'Analyst', email: 'person@example.test' },
    });
    await result;
    expect(auth.token()).toBe('signed-token');
    expect(auth.user()?.name).toBe('Analyst');
    auth.logout();
    expect(auth.token()).toBeNull();
    expect(auth.signedIn()).toBe(false);
  });
  it('does not authenticate on a failed login', () => {
    const error = jest.fn();
    auth.login('person@example.test', 'wrong').subscribe({ error });
    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Invalid login' }, { status: 401, statusText: 'Unauthorized' });
    expect(error).toHaveBeenCalled();
    expect(auth.token()).toBeNull();
  });
});
