# Development plan

This is a sample Agile backlog for an individual portfolio project, not evidence of work in a commercial Scrum team.

| Story                                          | Acceptance criteria                                                                                                | Engineering tasks                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| As an analyst, I can sign in securely          | Invalid credentials show an error; protected endpoints reject missing/expired tokens; logout removes local session | Environment configuration, JWT verification, reactive login form, interceptor, guard tests |
| As an analyst, I can review KPIs               | Revenue, units, AOV, category share and period growth respond to all filters                                       | Deterministic fixture data, aggregate functions, dashboard endpoint, KPI cards             |
| As an analyst, I can explore trends            | Time series, category, region, product and segment visualizations have readable alternatives                       | Chart.js wrapper, chart lifecycle, accessible summaries, responsive SCSS                   |
| As an analyst, I can compare products          | Search, sort, pagination and product detail routes work; loading/empty/error states are visible                    | Product endpoint, reusable table, debounced queries, dynamic route                         |
| As a maintainer, I can change code confidently | Tests cover auth, HTTP errors, filter math, table behavior and dashboard state                                     | Jest frontend suites, Node API tests, review boundary cases                                |
| As a contributor, I receive CI feedback        | Pull requests and main pushes install, lint, test and build both applications                                      | Lockfile, GitHub Actions, build budgets, documentation                                     |

## Suggested iterations

1. Foundation: scaffold strict workspaces, health endpoint, initial checks.
2. API: deterministic sales data, query validation, metric definitions and authentication.
3. Frontend: shell, login, filters, dashboard, products and data explorer.
4. Quality: functional smoke checks, accessibility review, documentation and CI.

Definition of done: acceptance criteria met, meaningful automated checks pass, user-facing error states implemented, documentation updated, no credentials in tracked files. Use small Git branches and pull requests per story. GitHub issues and a real team cadence remain future work.
