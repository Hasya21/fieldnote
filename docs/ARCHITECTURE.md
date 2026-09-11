# Architecture and metric semantics

## Data flow

Reactive Forms → FilterStore signal → RxJS request stream → typed HttpClient service → auth/error interceptor → Express authorization → Zod query schema → aggregation functions → typed response → OnPush view and shared chart/table components.

A feature owns its query state and user-facing loading/error state. The table owns only presentation and user events, and emits complete query values. The server clamps pagination after filters reduce the result set. Product and sales features display the server's actual page. Explicit refresh/retry updates a signal without reloading the application.

The backend is separated into app factory and startup. Tests pass a generated configuration to the app factory and call it with Supertest; startup alone reads environment variables and listens on a port.

## Dataset

The seed is fixed at 7429. A deterministic generator creates 32 order lines per day over 731 days: 23,392 records. Sixteen fictional products each contribute two orders daily. Every record has an independent order ID and one product line. Price noise, seasonality and a 2025 factor create variation but do not model observed human behavior. Dimensions are synthetic assignments, not representative populations.

No database was added because persistence would not improve a read-only demonstration built around reproducible sample data. Arrays are the source of truth for this demo.

## Definitions

| Metric                         | Definition and caveat                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Revenue                        | Sum of selected sales revenue in USD, rounded to cents                                                          |
| Units sold                     | Sum of selected unitsSold                                                                                       |
| Orders                         | Count of distinct selected orderId values; each generated order has one product line                            |
| AOV                            | Selected revenue / distinct selected orders, zero for no orders; card display rounds to whole USD               |
| Category share                 | Selected revenue / revenue with the category filter removed, keeping date, region, retailer and segment filters |
| Product selection share        | Product revenue / selected portfolio revenue; list honors category filter, detail uses all categories           |
| Growth                         | (Current revenue - preceding period revenue) / preceding period revenue × 100                                   |
| Previous period                | Immediately preceding interval with the same inclusive number of days                                           |
| Missing growth                 | null when previous revenue is zero or the previous interval begins before available data                        |
| Monthly trend                  | Revenue grouped by YYYY-MM; includes zero months in the selected range                                          |
| Category/region/segment charts | Revenue grouped by that dimension, not counts of customers                                                      |
| Top products                   | Five highest-revenue products in the selection                                                                  |

All date logic uses UTC date-only boundaries. A partial month shows only selected days. Category share is 100% when no category is selected and the denominator is nonzero. No orders produces zero revenue, units, AOV and share; growth can be -100% if a nonzero comparable previous period exists. This is dataset contribution, not a real external market share estimate.

## Maintainability

Core services do not depend on feature components. Shared charts/tables accept data through typed inputs and emit actions. Features are independently lazy-loaded and use the same reusable controls. SCSS variables, typography and responsive mixins provide a small design foundation while component styles stay local.

The TypeScript models are deliberately small; frontend API types and server models are separate and manually aligned. A generated OpenAPI client would be a useful next step. Strict TypeScript catches implementation mistakes but does not validate arbitrary network responses at runtime.

## Performance tradeoffs

The current dataset is small enough to aggregate in process. Product metrics scan selected rows per product, which is straightforward for sixteen products but would need indexed aggregation at larger scale. There is no measured concurrency or latency benchmark. Bounded server pagination reduces response size, not the aggregation work itself.

Client switchMap unsubscribes stale requests. This does not guarantee cancellation of server computation already underway. Chart.js is dynamically imported; each chart instance is destroyed when its input changes or the view leaves. Successful options responses are shared because metadata is immutable.

No automatic request retries are used: explicit retry is predictable and does not amplify an unavailable server or repeat invalid login attempts.

## Deployment boundary

The Angular bundle and compiled API are separate artifacts. A production reverse proxy must serve the SPA with route fallback and forward /api to the backend. TLS, frontend CSP, availability, logging and secret management are deployment responsibilities. GitHub Actions creates artifacts but does not deploy them.
