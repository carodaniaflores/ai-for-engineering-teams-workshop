# Feature: CustomerHealthMonitoring

## Context
- Comprehensive customer health scoring and predictive alerting system for the Customer Intelligence Dashboard
- Provides real-time visibility into customer relationship health, churn risk, and actionable early warnings
- Used by customer success managers to proactively intervene before customers churn or disengage
- Composed of two integrated subsystems: a `healthCalculator` library and a `alerts` rules engine, plus their respective UI widgets

## Requirements

### Functional Requirements

#### Health Score Calculator (`lib/healthCalculator.ts`)
- Calculate a composite customer health score on a 0–100 scale
- Multi-factor weighted scoring:
  - Payment history (40%): days since last payment, average payment delay, overdue amounts
  - Engagement metrics (30%): login frequency, feature usage count, support ticket volume
  - Contract information (20%): days until renewal, contract value, recent upgrades
  - Support data (10%): average resolution time, satisfaction scores, escalation counts
- Risk level classification:
  - Healthy: 71–100
  - Warning: 31–70
  - Critical: 0–30
- Individual scoring functions per factor, each returning a normalized 0–100 sub-score
- Main `calculateHealthScore` function composing all factor scores into a final weighted result
- Input validation with descriptive error messages; edge case handling for new customers and missing data

#### Predictive Alerts Engine (`lib/alerts.ts`)
- Rule-based alert engine evaluating all customers against configurable thresholds
- **High Priority alerts** (immediate action):
  - *Payment Risk*: payment overdue >30 days OR health score drops >20 points in 7 days
  - *Engagement Cliff*: login frequency drops >50% vs. 30-day average
  - *Contract Expiration Risk*: contract expires in <90 days AND health score <50
- **Medium Priority alerts** (monitor closely):
  - *Support Ticket Spike*: >3 support tickets in 7 days OR escalated ticket present
  - *Feature Adoption Stall*: no new feature usage in 30 days for growing accounts
- Deduplication logic to prevent duplicate alerts for the same customer/issue
- Cooldown periods to prevent alert fatigue
- Alert history tracking and audit trail

#### UI Components
- `CustomerHealthDisplay` widget: overall health score with color-coded visualization and expandable factor breakdown
- `AlertsPanel` widget: real-time alert list with priority color coding (red/yellow), detail panels with recommended actions, dismissal and action tracking
- Loading and error states consistent with existing dashboard widget patterns
- Real-time updates when `CustomerSelector` selection changes

### User Interface Requirements
- Health score displayed as a prominent numeric badge with risk-level color (red/yellow/green)
- Expandable section showing individual factor scores (Payment, Engagement, Contract, Support)
- Alerts listed by priority with distinct visual treatment; dismissed alerts removed from view
- Color coding aligned with the existing `CustomerCard` health indicator palette

### Data Requirements
- `CustomerHealthInput` interface covering all four factor data groups (payment, engagement, contract, support)
- `HealthScoreResult` interface: `{ overall: number; riskLevel: 'healthy' | 'warning' | 'critical'; breakdown: FactorScores }`
- `Alert` interface: `{ id: string; customerId: string; type: AlertType; priority: 'high' | 'medium'; message: string; triggeredAt: string; dismissed: boolean }`
- No sensitive customer data (PII, payment credentials) exposed in alert message strings

### Integration Requirements
- Integrates with existing `CustomerSelector` component; re-evaluates scores and alerts on customer change
- Consistent error handling and loading state patterns with other dashboard widgets
- Alert state synchronized across dashboard sessions (if applicable)
- Color coding consistent with existing `CustomerCard` health indicators

## Constraints

### Technical Stack
- Next.js 15 (App Router), React 19, TypeScript (strict mode), Tailwind CSS

### Performance Requirements
- Pure function architecture — no side effects; suitable for real-time dashboard updates
- Efficient rule evaluation for hundreds of customers with minimal latency
- Caching considerations for repeated score calculations within a single session

### Design Constraints
- Responsive layout compatible with existing dashboard grid
- Health indicator colors must meet WCAG 2.1 AA contrast ratios
- Consistent Tailwind spacing and color scales with the rest of the project

### File Structure and Naming
- `src/lib/healthCalculator.ts` — all calculation functions and TypeScript interfaces
- `src/lib/alerts.ts` — alert rules engine functions and TypeScript interfaces
- `src/components/CustomerHealthDisplay.tsx` — health score UI widget
- `src/components/AlertsPanel.tsx` — alerts UI widget
- PascalCase for components, camelCase for library functions

### Security Considerations
- Input validation on all customer data and rule parameters before processing
- No sensitive customer data (PII, credentials) in alert message payloads
- Rate limiting on alert generation to prevent rule engine abuse
- Audit trail logging for all triggered alerts and user dismissal actions
- No `dangerouslySetInnerHTML`; all alert messages rendered as sanitized plain text

## Acceptance Criteria

### Health Score Calculator
- [ ] `calculateHealthScore` returns a value between 0 and 100 for valid input
- [ ] Weighted breakdown matches: Payment 40%, Engagement 30%, Contract 20%, Support 10%
- [ ] Risk level classified correctly: Healthy (71–100), Warning (31–70), Critical (0–30)
- [ ] Individual factor functions each return a normalized 0–100 sub-score
- [ ] Invalid or missing inputs produce descriptive validation errors, not silent failures
- [ ] New customer edge cases (no payment history, zero logins) handled without crashing
- [ ] All functions are pure with no side effects
- [ ] Full unit test coverage including boundary conditions and mathematical accuracy

### Predictive Alerts Engine
- [ ] High priority Payment Risk alert triggers for payment overdue >30 days
- [ ] High priority Engagement Cliff alert triggers for >50% login frequency drop
- [ ] High priority Contract Expiration Risk triggers for <90 days + health score <50
- [ ] Medium priority Support Ticket Spike triggers for >3 tickets in 7 days or escalation
- [ ] Medium priority Feature Adoption Stall triggers for no new feature usage in 30 days
- [ ] Duplicate alerts for the same customer/issue are deduplicated
- [ ] Cooldown periods prevent repeated alert generation within the window
- [ ] No PII or sensitive data present in generated alert message strings

### UI Components
- [ ] `CustomerHealthDisplay` renders overall score with correct risk-level color
- [ ] Factor breakdown is expandable and shows all four factor sub-scores
- [ ] `AlertsPanel` renders alerts sorted by priority (high before medium)
- [ ] Alert dismissal removes the alert from the active list
- [ ] Loading and error states render consistently with other dashboard widgets
- [ ] Components update in real time when `CustomerSelector` changes the active customer
- [ ] Responsive layout works on mobile and desktop viewports
- [ ] All components pass TypeScript strict mode checks with no console errors
