import { pageSchema, productSchema, sessionSchema, validateResponse } from './contracts';
describe('API response contracts', () => {
  it('rejects malformed analytics instead of rendering invalid values', () => {
    expect(() =>
      validateResponse(pageSchema(productSchema), {
        items: [{ revenue: 'bad' }],
        total: 1,
        page: 1,
        pageSize: 8,
      }),
    ).toThrow('incompatible response');
  });
  it('rejects incomplete sessions', () =>
    expect(() => validateResponse(sessionSchema, { token: 'token' })).toThrow(
      'incompatible response',
    ));
});
