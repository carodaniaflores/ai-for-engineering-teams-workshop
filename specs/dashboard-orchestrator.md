# Feature: DashboardOrchestrator

## Context
- Top-level orchestration layer for the Customer Intelligence Dashboard, transforming the prototype into a production-ready application
- Coordinates all dashboard widgets (CustomerSelector, CustomerHealthDisplay, AlertsPanel, MarketIntelligence) under unified error handling, performance, and accessibility standards
- Used by all customer success stakeholders in business-critical, daily operations
- Sits at the application root and owns the error boundary hierarchy, export system, performance optimization boundaries, and deployment configuration

## Requirements

### Functional Requirements

#### Error Handling and Resilience
- Multi-level error boundary hierarchy:
  - `DashboardErrorBoundary` — application-level; catches unhandled errors across the entire dashboard
  - `WidgetErrorBoundary` — isolates individual widget failures so other widgets remain functional
- Graceful degradation: a failed widget renders a fallback UI (error state card) without taking down the dashboard
- User-friendly error messages with retry buttons and recovery options
- Development mode: full error details and stack traces; production mode: sanitized messages with no internal disclosure
- Automatic error reporting to the configured monitoring integration on each boundary catch

#### Data Export and Portability
- Export customer data in CSV and JSON formats with configurable filters (date range, customer segment)
- Export health score reports including historical data and per-factor breakdowns
- Export alert history and audit logs for compliance purposes
- Export market intelligence summaries and trend reports
- Progress indicators and cancellation support for long-running exports
- File names include timestamps and dataset metadata (e.g. `customers-export-2026-03-11.csv`)
- Export audit log entry created for every export action

#### Performance Optimization
- `React.memo` and `useMemo` applied to expensive child components and derived computations
- `React.lazy` + `Suspense` boundaries for code-split widget loading
- Virtual scrolling for customer lists and data tables exceeding 50 rows
- `useCallback` on all event handler props passed to memoized children
- Service worker for offline capability and static asset caching
- Core Web Vitals monitoring: FCP <1.5s, LCP <2.5s, CLS <0.1, TTI <3.5s

#### Accessibility Compliance
- WCAG 2.1 AA across all dashboard components
- Semantic HTML landmarks (`<main>`, `<nav>`, `<aside>`, `<section>`) with descriptive labels
- Skip-to-content link as first focusable element in the document
- Logical tab order following visual content flow; no positive `tabIndex` values
- Focus trap in modals and export dialogs; focus restored on close
- ARIA live regions (`aria-live="polite"`) for dynamic content updates and alert notifications
- Loading state announcements via `aria-busy` and live regions
- High contrast mode support; no information conveyed by color alone

#### Security Hardening
- Content Security Policy (CSP) headers configured in Next.js response headers
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- All user inputs and API responses sanitized before rendering or processing
- Rate limiting on export endpoints (configurable; default 10 exports/min per session)
- Sensitive information (stack traces, internal paths, customer PII) never exposed in production error messages or logs
- CSRF protection on all mutating API routes
- HTTPS enforced; secure cookie flags set where applicable

### User Interface Requirements
- Dashboard shell with consistent header, navigation, and responsive grid layout
- Per-widget loading skeletons rendered within `Suspense` fallbacks
- Export controls accessible from a toolbar or dedicated export panel with format and filter options
- Error fallback cards match the visual footprint of the widget they replace (no layout shift)
- High-contrast and reduced-motion variants honored via CSS media queries

### Data Requirements
- `DashboardConfig` interface: environment, feature flags, export settings, monitoring endpoints
- `ExportRequest` interface: `{ format: 'csv' | 'json'; dataSource: ExportDataSource; filters: ExportFilters; requestedAt: string }`
- `ErrorReport` interface: `{ errorId: string; boundary: 'dashboard' | 'widget'; message: string; context: Record<string, unknown>; timestamp: string }`
- No customer PII or credentials present in `ErrorReport.context` payloads

### Integration Requirements
- Wraps all existing widgets (CustomerSelector, CustomerHealthDisplay, AlertsPanel, MarketIntelligence) without modifying their internal logic
- Provides a unified `useExport` hook consumed by any widget that needs export capability
- Provides a unified `useErrorReporting` hook for manual error reporting from child components
- Production logging and error tracking integration configured via environment variables
- Health check endpoint at `/api/health` returning service and dependency status for load balancer probes
- CDN-compatible static asset configuration in `next.config.ts`

## Constraints

### Technical Stack
- Next.js 15 (App Router), React 19, TypeScript (strict mode), Tailwind CSS

### Performance Requirements
- Initial page load under 3 seconds on standard broadband
- FCP <1.5s, LCP <2.5s, CLS <0.1, TTI <3.5s
- 60fps interactions and animations; no jank during widget transitions
- Memory usage monitored; no retained references causing leaks across customer selection changes

### Design Constraints
- Error fallback components must match the bounding box of the replaced widget (no layout shift)
- Export dialog must be keyboard-accessible and focus-trapped
- All color-only indicators must have a secondary non-color cue (icon, pattern, label)
- Consistent Tailwind spacing and color scales with existing components

### File Structure and Naming
- `src/components/DashboardOrchestrator.tsx` — root orchestration component
- `src/components/DashboardErrorBoundary.tsx` — application-level error boundary
- `src/components/WidgetErrorBoundary.tsx` — widget-level error boundary
- `src/lib/exportUtils.ts` — format-specific export handlers and streaming logic
- `src/hooks/useExport.ts` — export hook for widget consumers
- `src/hooks/useErrorReporting.ts` — manual error reporting hook
- `src/app/api/health/route.ts` — health check endpoint
- `next.config.ts` — security headers, CDN, and bundle configuration
- PascalCase for components, camelCase for hooks and utilities

### Security Considerations
- CSP policy must be configured before any third-party scripts are added
- `exportUtils.ts` must validate user permissions before streaming any data
- Error boundaries must strip stack traces and file paths from production error reports
- Export file contents must not include fields beyond what the user's role is authorized to see
- No `dangerouslySetInnerHTML` anywhere in the orchestration layer

## Acceptance Criteria

### Error Handling
- [ ] `DashboardErrorBoundary` catches an unhandled throw at the app level and renders a full-page fallback with a retry option
- [ ] `WidgetErrorBoundary` isolates a widget failure; all other widgets remain functional and visible
- [ ] Production error messages contain no stack traces, file paths, or internal identifiers
- [ ] Development error messages display full context including component stack
- [ ] Retry mechanism resets the boundary and re-mounts the failed subtree
- [ ] Error events are reported to the monitoring integration with `errorId`, `boundary`, and sanitized context

### Data Export
- [ ] CSV and JSON exports are generated correctly for customer data, health reports, alert history, and market intelligence
- [ ] Filters (date range, customer segment) correctly scope exported data
- [ ] Progress indicator is shown for exports exceeding 1 second; cancellation stops the stream
- [ ] Exported file names include dataset type and ISO timestamp
- [ ] Each export action creates an audit log entry
- [ ] Export endpoint enforces rate limiting; excess requests receive a 429 response

### Performance
- [ ] Core Web Vitals meet targets: FCP <1.5s, LCP <2.5s, CLS <0.1, TTI <3.5s on a simulated mid-tier device
- [ ] Widgets are code-split; each loads independently without blocking the dashboard shell
- [ ] Virtual scrolling activates for customer lists with >50 rows; no layout thrash
- [ ] No unnecessary re-renders in memoized widgets when unrelated state changes
- [ ] Service worker caches static assets; dashboard shell loads from cache on repeat visits

### Accessibility
- [ ] Skip-to-content link is the first focusable element and moves focus to `<main>` on activation
- [ ] All widgets reachable and operable by keyboard alone; tab order matches visual flow
- [ ] ARIA live region announces new alerts without stealing focus
- [ ] Export dialog traps focus while open; focus returns to trigger element on close
- [ ] All color indicators have a non-color secondary cue
- [ ] Passes automated axe-core audit with zero critical or serious violations
- [ ] Manual keyboard navigation testing passes across CustomerSelector, AlertsPanel, and export dialog

### Security
- [ ] CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` headers present on all responses
- [ ] All user inputs and API responses sanitized; no raw HTML injected into the DOM
- [ ] Export endpoint rejects unauthorized requests with 401/403; no data leak on error
- [ ] Rate limiting blocks export requests beyond configured threshold
- [ ] `/api/health` returns `{ status: 'ok' }` when all dependencies are healthy; appropriate error status otherwise

### Deployment Readiness
- [ ] `next build` completes without errors or type violations
- [ ] Bundle analysis confirms no unexpectedly large chunks; tree shaking removes dead code
- [ ] Environment variables required for production are documented and validated at startup
- [ ] `/api/health` endpoint responds within 200ms under normal load
- [ ] Source maps generated for production debugging without exposing them publicly
