# Security design and limitations

## Authentication and secrets

The backend refuses to start without a valid DEMO_EMAIL, DEMO_PASSWORD (12+ characters), and JWT_SECRET (32+ characters). These values come from the process environment or an ignored backend/.env file. The setup script creates random local secrets and never overwrites existing configuration. The example environment file contains blank values, not usable credentials.

Passwords are compared against a salted scrypt hash generated at startup, using timingSafeEqual. This is a single-user demo; it is not a user database, registration, password-reset or identity-management system. scrypt runs synchronously and is protected by login rate limiting, but should move to a proper asynchronous identity service under production load.

Tokens expire after 30 minutes and are signed/verified with an explicit HS256 algorithm, issuer, audience, and analyst role. Server middleware protects every analytics route. Angular guards are a navigation convenience, not the authorization boundary.

The browser holds tokens in memory only: no localStorage, sessionStorage, URL query token, or persistent cookie. Logout removes browser state; the token remains valid server-side until expiry, so this is not a revocation mechanism. Reloading requires login. The frontend expiry timer redirects an active workspace to sign-in.

The interceptor adds bearer tokens only to local /api/ URLs. HTTP 401 clears the session; 403 produces a permission message. HTTPS is mandatory when deployed. CORS is intentionally not opened to arbitrary origins; development uses Angular's same-origin proxy.

## Request and response protections

- Zod validates dates, enumerated filters, sort keys, search length, pagination bounds and login payloads.
- JSON bodies are limited to 8 kB; unexpected request fields are rejected.
- Login is limited to 10 attempts per IP per 15 minutes; analytics to 120 requests per IP per minute.
- Helmet supplies API response headers; Express signature is disabled.
- API responses use Cache-Control: no-store, including successful login.
- Generic authentication errors do not distinguish unknown accounts from bad passwords.
- Angular interpolation and property binding escape text. No direct innerHTML or sanitization bypass is used.
- There is no SQL layer and no string-built query execution. A future database implementation must use parameterized queries.
- Error responses do not expose stack traces.

Bearer tokens are not automatically attached by the browser as cookies, reducing conventional cookie-based CSRF exposure. XSS could still act as the user or access in-memory tokens. Memory storage is not an XSS defense.

## Deployment responsibilities and gaps

The app is a portfolio demo with production-oriented safeguards, not a security-certified system. No penetration test, formal threat assessment, audit trail, real identity provider, token revocation, persistent users, distributed rate-limit store, or secret rotation service is implemented.

Helmet runs on the API; configure the static frontend host's CSP and security headers separately. Serve frontend and API under one HTTPS origin. Configure trusted proxies narrowly if needed; do not blindly enable trust proxy. The API binds to loopback by default for local use, requiring deliberate deployment network configuration.

Dependencies are locked. Re-run npm audit and review upgrades; a clean audit is not proof of security. Keep generated .env, test traces, logs and node_modules out of Git. Never place secrets in Angular environment files because compiled frontend configuration is public.

For a security issue in a published fork, use the repository owner's private reporting channel rather than posting exploitable details in a public issue. No dedicated reporting address is configured in this local repository.

## Guest access and hosting

See docs/UPGRADE.md for adapter differences. DEMO_ACCESS enables password-free access to synthetic records. Disable it before adapting this project to private data. Browser schemas reject malformed responses. CSV fields are quoted and spreadsheet formula prefixes are neutralized.
