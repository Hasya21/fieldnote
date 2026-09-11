# Fieldnote upgrade

## Distinct workflows

- Overview: prior KPI values and signed changes, aligned previous-period revenue, calculated category/region movements, and chart drilldowns with keyboard-accessible data.
- Products: revenue leaders, fastest growers, declining products, monthly sparklines, and comparison of two or three products across revenue, growth, contribution, units and trends.
- Sales: individual orders, selected rows, sticky headers, exact amounts, page subtotals, desktop inspector, and native mobile details dialog. CSV exports every matching order using filters and search captured at export time.

## State and calculations

Dates, dimensions, product drilldown, search, sort, page, view, and comparison are URL parameters. Browser history restores them. Invalid date/dimension parameters fall back with a notice. Navigation preserves filters; search and sort remain specific to each page URL.

Presets use sample dates. Active dimension filters have removable chips. Search and filter empty states offer relevant recovery actions. The mobile dialog contains focus, closes with Escape, and restores focus.

Previous periods contain the same number of inclusive days immediately before the selected interval. Incomplete baselines show unavailable growth. Prior days shift onto current dates before monthly aggregation, including partial months. Insights describe observed changes, not causation.

Product comparisons ignore category and product-ID filters to compare across categories. Date, retailer, region and segment still apply; the panel states this scope.

## Hosting and security

Local development remains Angular + Express. A Cloudflare Worker imports the same pure analytics/query functions for the hosted demo. It offers only guest access and read operations; local credentials are never uploaded. JWT_SECRET is supplied as a hosted secret.

Sites audience controls are separate from guest sessions. A private deployment still requires its owner's platform access.

Express has in-process throttling and Helmet. The Worker relies on hosting infrastructure for traffic controls and supplies no-store and MIME-sniffing protections. Neither adapter provides enterprise identity, persistent users, token revocation, or distributed rate limiting.

Automated axe checks cover overview, comparison, sales inspection and the mobile dialog. This is not a formal accessibility certification.
