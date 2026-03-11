# Feature: PredictiveIntelligence

## Context
- Unified predictive intelligence layer for the Customer Intelligence Dashboard combining proactive risk alerting with real-time market sentiment analysis
- Surfaces early warning signals from two complementary data streams: internal customer behavioral metrics (engagement, payments, contracts, support) and external market conditions (news sentiment, company headlines)
- Used by customer success managers to prioritize outreach, anticipate churn risk, and contextualize customer health within broader market developments
- Composed of three integrated subsystems: the `alerts` rules engine (`lib/alerts.ts`), the `MarketIntelligenceService` service layer, and the `PredictiveIntelligencePanel` UI component that brings both together

## Requirements

### Functional Requirements

#### Predictive Alerts Engine (`lib/alerts.ts`)
- Rule-based engine evaluating all alert rules against current customer data on each invocation
- **High Priority alerts** (immediate action required):
  - *Payment Risk*: payment overdue >30 days OR health score drops >20 points within 7 days
  - *Engagement Cliff*: login frequency drops >50% compared to the customer's 30-day average
  - *Contract Expiration Risk*: contract expires in <90 days AND current health score <50
- **Medium Priority alerts** (monitor closely):
  - *Support Ticket Spike*: >3 support tickets in 7 days OR any escalated ticket present
  - *Feature Adoption Stall*: no new feature usage in 30 days for accounts on a growth trajectory
- Deduplication: suppress duplicate alerts for the same customer/rule combination within a configurable cooldown window
- Alert history tracking with audit trail entries for every trigger and dismissal event
- Business hours awareness for alert delivery timing (configurable)
- Priority scoring algorithm incorporating customer ARR and urgency to rank simultaneous alerts

#### Market Intelligence Service (`lib/marketIntelligenceService.ts` + `/api/market-intelligence/[company]`)
- Next.js App Router Route Handler at `/api/market-intelligence/[company]`
- Mock data generation producing realistic, company-specific headlines and sentiment scores for predictable demonstration
- Simulated API delay for authentic loading UX
- Response shape: `{ sentiment: 'positive' | 'neutral' | 'negative'; sentimentScore: number; newsCount: number; headlines: Headline[]; updatedAt: string }`
- `MarketIntelligenceService` class with 10-minute TTL cache to avoid redundant mock generation
- `MarketIntelligenceError` custom error class for centralized error categorization
- Company name input validation and sanitization before mock generation or cache lookup

#### UI Component (`PredictiveIntelligencePanel`)
- Unified panel rendering both alert feed and market intelligence side by side (or stacked on mobile)
- **Alert feed section**:
  - Alerts sorted by priority (high before medium), then by recency
  - Color-coded priority badges: red for high, yellow for medium
  - Alert detail expansion showing recommended action and triggering context
  - Dismiss button per alert; dismissed alerts removed from active list
  - Historical alerts accessible via a toggle/tab
- **Market intelligence section**:
  - Company name auto-populated from the active `CustomerSelector` selection; user-editable
  - Sentiment displayed with color-coded indicator (green = positive, yellow = neutral, red = negative) plus a non-color label
  - News article count and `updatedAt` timestamp
  - Top 3 headlines with source name and publication date
- Loading skeletons for both sections during async operations
- Error state with retry button, consistent with other dashboard widgets
- Real-time updates when `CustomerSelector` changes the active customer

### User Interface Requirements
- Panel fits within the existing responsive dashboard grid without breaking layout
- Color coding (red/yellow/green) consistent with `CustomerCard` and `CustomerHealthDisplay` palettes
- All color indicators paired with a secondary non-color cue (icon or text label) for accessibility
- Hover/focus states on alert items and headline rows
- Dismiss and retry actions keyboard-accessible

### Data Requirements
- `Alert` interface: `{ id: string; customerId: string; type: AlertType; priority: 'high' | 'medium'; message: string; recommendedAction: string; triggeredAt: string; dismissed: boolean; cooldownUntil?: string }`
- `AlertType` union: `'payment-risk' | 'engagement-cliff' | 'contract-expiration' | 'support-spike' | 'feature-stall'`
- `MarketIntelligenceResponse` interface: `{ sentiment: 'positive' | 'neutral' | 'negative'; sentimentScore: number; newsCount: number; headlines: Headline[]; updatedAt: string }`
- `Headline` interface: `{ title: string; source: string; publishedAt: string }`
- No customer PII or credentials in alert `message` or `recommendedAction` strings
- No sensitive internal data exposed in `MarketIntelligenceError` messages returned to the client

### Integration Requirements
- Receives active customer object from `CustomerSelector`; re-evaluates alerts and fetches market data on selection change
- `useAlerts` hook encapsulates alert state, dismissal, and history for consumption by `PredictiveIntelligencePanel`
- `useMarketIntelligence` hook encapsulates fetch, caching coordination, and error state
- Consistent loading and error state patterns with `CustomerHealthDisplay` and other dashboard widgets
- Alert dismissal state persisted for the session; not lost on customer re-selection
- Market intelligence cache shared across panel re-renders via service layer (not hook-local state)

## Constraints

### Technical Stack
- Next.js 15 (App Router, Route Handlers), React 19, TypeScript (strict mode), Tailwind CSS

### Performance Requirements
- Alert rule evaluation completes synchronously with no perceptible delay for up to 500 customers
- Market intelligence API response (including simulated delay) delivered within 2 seconds
- 10-minute TTL cache in `MarketIntelligenceService` prevents redundant mock generation
- No unnecessary re-renders in the panel when unrelated dashboard state changes
- Virtual list for alert history if entry count exceeds 50 items

### Design Constraints
- Panel respects existing dashboard responsive grid breakpoints
- Minimum touch target 44px for dismiss buttons and expandable alert rows
- Color indicators meet WCAG 2.1 AA contrast requirements
- Stacked layout on mobile; side-by-side on ≥768px viewports

### File Structure and Naming
- `src/lib/alerts.ts` — pure alert rule functions and TypeScript interfaces
- `src/lib/marketIntelligenceService.ts` — `MarketIntelligenceService` class, cache, and `MarketIntelligenceError`
- `src/app/api/market-intelligence/[company]/route.ts` — Route Handler
- `src/components/PredictiveIntelligencePanel.tsx` — unified UI component
- `src/hooks/useAlerts.ts` — alert state and dismissal hook
- `src/hooks/useMarketIntelligence.ts` — market intelligence fetch and error hook
- PascalCase for components, camelCase for hooks and service methods

### Security Considerations
- Company name path parameter validated and sanitized before any processing (prevent injection)
- Alert `message` and `recommendedAction` fields must not include raw customer PII
- `MarketIntelligenceError` messages returned to the client must not disclose internal implementation details
- Rate limiting on `/api/market-intelligence/[company]` (default: 30 requests/min per session)
- No `dangerouslySetInnerHTML`; all headline text and alert messages rendered as plain text
- Follow same security patterns as existing customer management API routes

## Integration Architecture

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Dashboard (App Shell)                        │
│  (spec: dashboard-orchestrator.md)                                  │
│                                                                     │
│  ┌──────────────────────┐    ┌─────────────────────────────────┐   │
│  │   CustomerSelector   │───▶│   PredictiveIntelligencePanel   │   │
│  │  (customer-card.md)  │    │                                 │   │
│  └──────────────────────┘    │  ┌─────────────┐ ┌───────────┐ │   │
│                               │  │ Alert Feed  │ │ Market    │ │   │
│  ┌──────────────────────┐    │  │             │ │ Intel     │ │   │
│  │ CustomerHealthDisplay│    │  │ useAlerts   │ │ useMarket │ │   │
│  │ (customer-health-    │    │  │    hook     │ │ Intelligence│ │   │
│  │  monitoring.md)      │    │  └──────┬──────┘ └─────┬─────┘ │   │
│  └──────────────────────┘    └─────────┼──────────────┼───────┘   │
│           │                            │              │            │
│           │ shares health score        │              │            │
│           ▼                            ▼              ▼            │
│  ┌──────────────────┐     ┌────────────────┐  ┌─────────────────┐ │
│  │ lib/health       │     │ lib/alerts.ts  │  │ MarketIntel     │ │
│  │ Calculator.ts    │────▶│ (rules engine) │  │ Service.ts      │ │
│  └──────────────────┘     └────────────────┘  └────────┬────────┘ │
│                                                         │          │
│                                              ┌──────────▼────────┐ │
│                                              │ /api/market-      │ │
│                                              │ intelligence/     │ │
│                                              │ [company]         │ │
│                                              └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Description

**Alert data flow (internal):**
1. `CustomerSelector` emits the active `Customer` object on selection change
2. `useAlerts` hook receives the customer and passes their behavioral data to `lib/alerts.ts`
3. `lib/alerts.ts` evaluates all 5 alert rules as pure functions; returns a ranked `Alert[]`
4. `useAlerts` deduplicates against existing alert history and applies cooldown filtering
5. `PredictiveIntelligencePanel` renders the resulting alert list; user dismissals are written back into `useAlerts` state and appended to the audit trail

**Market intelligence data flow (external/mock):**
1. `CustomerSelector` emits the active customer; `company` name is extracted and passed to `useMarketIntelligence`
2. `useMarketIntelligence` checks `MarketIntelligenceService` cache (10-min TTL)
3. On cache miss, the hook calls `/api/market-intelligence/[company]`
4. The Route Handler validates and sanitizes the company name, invokes mock data generation, and returns `MarketIntelligenceResponse` JSON
5. `MarketIntelligenceService` stores the response in cache; `useMarketIntelligence` surfaces it to `PredictiveIntelligencePanel`
6. The market intelligence section re-renders with sentiment, headline count, and top 3 headlines

**Health score cross-dependency:**
- `lib/healthCalculator.ts` computes the current health score consumed by `CustomerHealthDisplay`
- `lib/alerts.ts` reads the same health score value (passed as part of `CustomerHealthInput`) to evaluate Payment Risk and Contract Expiration Risk thresholds — the two subsystems share a single authoritative score, never independently recalculate it

### Key Integration Points

| Integration Point | Consumer | Provider | Contract |
|---|---|---|---|
| Active customer selection | `PredictiveIntelligencePanel` | `CustomerSelector` | `Customer` object prop or shared context |
| Health score value | `lib/alerts.ts` | `lib/healthCalculator.ts` | `HealthScoreResult.overall: number` passed into alert input |
| Alert rule evaluation | `useAlerts` hook | `lib/alerts.ts` | Pure function: `evaluateAlerts(input: AlertInput): Alert[]` |
| Market data fetch | `useMarketIntelligence` hook | `/api/market-intelligence/[company]` | `MarketIntelligenceResponse` JSON; 400 on invalid input, 429 on rate limit |
| Service-layer cache | Route Handler | `MarketIntelligenceService` | `getIntelligence(company: string): Promise<MarketIntelligenceResponse>` |
| Error boundary wrapping | `WidgetErrorBoundary` | `DashboardOrchestrator` | Both alert feed and market section independently wrapped; failures isolated |
| Dismissal audit trail | `useAlerts` | Session storage / future persistence layer | `{ alertId, dismissedAt, customerId }` appended on each dismiss |

### Dependencies on Previously Created Specs

**`customer-health-monitoring.md`**
- `lib/healthCalculator.ts` must be implemented first; `lib/alerts.ts` depends on `HealthScoreResult.overall` to evaluate Payment Risk and Contract Expiration Risk thresholds
- `CustomerHealthDisplay` and `PredictiveIntelligencePanel` both receive the same active customer from `CustomerSelector` — color coding conventions (red/yellow/green at 0–30 / 31–70 / 71–100) must match exactly

**`customer-card.md`**
- `CustomerSelector` (which hosts `CustomerCard`) is the upstream source of the active `Customer` object flowing into this feature
- Health score color thresholds and Tailwind color classes established in `CustomerCard` must be reused verbatim in alert priority indicators to maintain visual consistency

**`dashboard-orchestrator.md`**
- `DashboardOrchestrator` wraps `PredictiveIntelligencePanel` in a `WidgetErrorBoundary`; the panel must not implement its own top-level error boundary
- Export system (`useExport` hook) provided by the orchestrator is available for future alert history export without additional infrastructure
- CSP and security headers configured in `next.config.ts` by the orchestrator cover the `/api/market-intelligence/[company]` route — no additional header configuration needed in the Route Handler

## Acceptance Criteria

### Predictive Alerts Engine
- [ ] High priority Payment Risk alert triggers when payment is overdue >30 days
- [ ] High priority Payment Risk alert triggers when health score drops >20 points in 7 days
- [ ] High priority Engagement Cliff alert triggers when login frequency drops >50% vs. 30-day average
- [ ] High priority Contract Expiration Risk triggers when contract expires <90 days AND health score <50
- [ ] Medium priority Support Ticket Spike triggers for >3 tickets in 7 days or any escalated ticket
- [ ] Medium priority Feature Adoption Stall triggers for no new feature usage in 30 days on growth accounts
- [ ] Duplicate alerts for the same customer/rule within the cooldown window are suppressed
- [ ] All alert rule functions are pure with no side effects; full unit test coverage with boundary conditions
- [ ] No customer PII present in generated `message` or `recommendedAction` strings

### Market Intelligence Service
- [ ] `/api/market-intelligence/[company]` returns valid `MarketIntelligenceResponse` JSON for any valid company name
- [ ] Invalid or missing company names return a 400 response with a sanitized error message
- [ ] Simulated API delay is present; response arrives within 2 seconds
- [ ] `MarketIntelligenceService` cache returns a cached response within TTL without re-generating mock data
- [ ] Cache expires after 10 minutes and fresh data is generated on the next request
- [ ] `MarketIntelligenceError` is thrown (and caught) on service-layer failures; no raw errors bubble to the UI
- [ ] Rate limiting returns 429 for requests exceeding the configured threshold

### UI Component
- [ ] Alert feed renders high priority alerts before medium priority alerts
- [ ] Each alert shows correct priority color badge (red/high, yellow/medium) plus a non-color label
- [ ] Alert detail expands to show recommended action on click/keyboard activation
- [ ] Dismiss button removes the alert from the active list; dismissed alerts appear in history view
- [ ] Market sentiment displays correct color indicator and text label (positive/neutral/negative)
- [ ] Top 3 headlines render with title, source, and publication date
- [ ] `updatedAt` timestamp and news count are displayed in the market intelligence section
- [ ] Loading skeleton is shown for both sections while data loads
- [ ] Error state with retry button is shown when either data source fails; other section remains functional
- [ ] Panel updates correctly when `CustomerSelector` changes the active customer
- [ ] All interactive elements are keyboard-accessible with visible focus indicators
- [ ] Passes automated axe-core audit with zero critical or serious violations
- [ ] Responsive layout stacks on mobile (<768px) and renders side-by-side on wider viewports
- [ ] TypeScript strict mode passes with no type errors or console warnings
