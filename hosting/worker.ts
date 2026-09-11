import { queryApi } from '../backend/src/query-api.js';
interface Environment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  JWT_SECRET: string;
}
const encoder = new TextEncoder();
function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
function decode(text: string): Uint8Array {
  return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
}
async function key(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}
function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      if (!['GET', 'HEAD'].includes(request.method))
        return json({ message: 'Read-only demo.' }, 405);
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404 && !url.pathname.split('/').at(-1)?.includes('.'))
        response = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
      return response;
    }
    if (url.pathname === '/api/health') return json({ status: 'ok' });
    if (url.pathname === '/api/auth/config')
      return json({ demoAccess: true, passwordLogin: false });
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32)
      return json({ message: 'Demo access is not configured.' }, 503);
    if (url.pathname === '/api/auth/demo' && request.method === 'POST') {
      const expiresAt = Date.now() + 30 * 60 * 1000;
      const header = base64(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
      const payload = base64(
        encoder.encode(
          JSON.stringify({
            sub: 'guest',
            role: 'analyst',
            iss: 'fieldnote',
            aud: 'fieldnote',
            exp: Math.floor(expiresAt / 1000),
          }),
        ),
      );
      const input = header + '.' + payload;
      const signature = base64(
        new Uint8Array(
          await crypto.subtle.sign('HMAC', await key(env.JWT_SECRET), encoder.encode(input)),
        ),
      );
      return json({
        token: input + '.' + signature,
        expiresAt,
        user: { name: 'Guest analyst', email: 'guest@fieldnote.example' },
      });
    }
    if (request.method !== 'GET') return json({ message: 'This demo is read-only.' }, 405);
    try {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
      const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
      if (
        header.alg !== 'HS256' ||
        claims.exp <= Date.now() / 1000 ||
        typeof claims.exp !== 'number' ||
        claims.iss !== 'fieldnote' ||
        claims.aud !== 'fieldnote' ||
        claims.role !== 'analyst'
      )
        throw new Error('Invalid token');
      if (
        !(await crypto.subtle.verify(
          'HMAC',
          await key(env.JWT_SECRET),
          decode(parts[2]),
          encoder.encode(parts[0] + '.' + parts[1]),
        ))
      )
        throw new Error('Invalid signature');
    } catch {
      return json({ message: 'Your session expired. Sign in again.' }, 401);
    }
    try {
      const result = queryApi(url.pathname, Object.fromEntries(url.searchParams));
      return typeof result.body === 'string'
        ? new Response(result.body, {
            status: result.status,
            headers: { ...result.headers, 'Cache-Control': 'no-store' },
          })
        : json(result.body, result.status);
    } catch {
      return json({ message: 'The service is temporarily unavailable.' }, 500);
    }
  },
};
