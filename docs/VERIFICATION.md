# Verification record

Verified September 11, 2026.

- ESLint passed.
- Frontend Jest: 8 suites, 14 tests passed.
- Backend and hosted adapter: 16 tests passed.
- Angular production build: 289.25 kB initial raw, 80.36 kB estimated transfer. Charts and validation are lazy loaded.
- Backend TypeScript and Worker bundle compiled.
- Browser coverage: desktop/mobile navigation, guest access, comparisons, URL filters, CSV download, selection, recovery, dialog focus and Escape.
- Automated axe scans cover overview, comparison, sales inspection and mobile order details.
- Installation audit reported zero vulnerabilities.

Run npm run check and npm run test:e2e to reproduce. Browser tests own ports 4201 and 3002, independent of development ports 4200 and 3001.

Screenshots live in docs/screenshots. Checks use Chromium against development servers; production output is separately compiled. This is local verification, not an executed GitHub Actions run. No cross-browser matrix, formal accessibility audit, penetration test or load test was performed.
