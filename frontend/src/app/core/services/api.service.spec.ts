import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { DEFAULT_FILTERS } from '../../shared/models/analytics';
describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('serializes active filters and pagination without blank parameters', () => {
    const received = jest.fn();
    api
      .products(
        { ...DEFAULT_FILTERS, region: 'North' },
        { search: 'tea', page: 2, pageSize: 8, sort: 'name', direction: 'asc' },
      )
      .subscribe(received);
    const request = http.expectOne((req) => req.url === '/api/products');
    expect(request.request.params.get('region')).toBe('North');
    expect(request.request.params.has('category')).toBe(false);
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [], total: 0, page: 1, pageSize: 8 });
    expect(received).toHaveBeenCalledWith({ items: [], total: 0, page: 1, pageSize: 8 });
  });
  it('propagates HTTP failures to callers', () => {
    const error = jest.fn();
    api.dashboard(DEFAULT_FILTERS).subscribe({ error });
    http
      .expectOne((req) => req.url === '/api/dashboard')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));
  });
});
