# Feature: HealthIndicator Component

## Context
- Reusable health score display component for the Customer Intelligence Dashboard
- Encapsulates the color-coded score badge + progress bar pattern currently duplicated inline in `CustomerCard`
- Used wherever a numeric health score (0–100) must be communicated visually to business analysts
- Candidate locations: `CustomerCard`, future `DomainHealthWidget` (Exercise 5), and any summary/detail views

## Requirements

### Functional Requirements
- Accept a numeric health score (0–100) and render both a score badge and a filled progress bar
- Map the score to one of three severity levels: Critical (0–30), Warning (31–70), Healthy (71–100)
- Display the human-readable severity label alongside the numeric score
- Allow the caller to opt out of the label or the bar via optional boolean props
- Emit no side effects — purely presentational, no data fetching

### User Interface Requirements
- Color coding consistent with the rest of the dashboard:
  - Red (`red-400` bar / `bg-red-100 text-red-800` badge): 0–30 Critical
  - Yellow (`yellow-400` bar / `bg-yellow-100 text-yellow-800` badge): 31–70 Warning
  - Green (`green-400` bar / `bg-green-100 text-green-800` badge): 71–100 Healthy
- Score badge: pill shape (`rounded-full`), tabular numeral, `text-xs font-semibold`
- Progress bar: 4px (`h-1`) full-width strip, `rounded-full`, fill width equals `score%`
- Severity label: `text-xs text-gray-400` or inline next to badge, controlled by `showLabel` prop
- Smooth CSS transition on bar fill for animated entry

### Data Requirements
- Props interface:

```ts
export interface HealthIndicatorProps {
  score: number;              // 0–100 integer or float
  showLabel?: boolean;        // default true — renders "Critical" / "Warning" / "Healthy"
  showBar?: boolean;          // default true — renders the progress bar
  className?: string;         // optional wrapper class override
}
```

- Derived entirely from `score`; no external data sources required
- `score` values outside 0–100 should be clamped (≤0 → 0, ≥100 → 100)

### Integration Requirements
- Replaces inline `healthColorClasses` + `healthLabel` logic in `CustomerCard.tsx`
- Exported as a named default from `src/components/HealthIndicator.tsx`
- `HealthIndicatorProps` exported from the same file for use by parent components
- No dependency on `mock-customers.ts` or any context/store

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19
- TypeScript with strict mode
- Tailwind CSS for all styling (no inline `style` except the dynamic `width` on the bar fill)

### Performance Requirements
- No state, no effects — renders in a single pass (< 1ms)
- Safe to use inside `React.memo`-wrapped parents without causing unnecessary re-renders
- No layout shift; bar container has fixed height `h-1`

### Design Constraints
- Responsive by default — stretches to 100% of its container width
- Badge and label must not truncate; allocate `shrink-0` where needed
- Minimum touch target for any interactive wrapper provided by parent, not this component
- Spacing uses Tailwind scale only (`gap-1`, `mt-1`, etc.)

### File Structure and Naming
- Component file: `src/components/HealthIndicator.tsx`
- Props interface: `HealthIndicatorProps` exported from the same file
- Internal helpers: `getHealthTier(score)` → `{ badge: string; bar: string; label: string }`
- Follow project PascalCase convention for component and interface names

### Security Considerations
- `score` is rendered as a number via JSX, never via `dangerouslySetInnerHTML` — no XSS risk
- Label strings are static constants, not user-supplied — no injection surface
- TypeScript strict types prevent passing non-numeric values

## Acceptance Criteria

- [ ] Renders a color-coded badge with the numeric score for Critical (0–30), Warning (31–70), and Healthy (71–100) ranges
- [ ] Renders a filled progress bar whose width equals `score%` of the container
- [ ] Badge and bar use the correct color tokens for each tier (red / yellow / green)
- [ ] `showLabel={false}` hides the severity label without affecting badge or bar
- [ ] `showBar={false}` hides the progress bar without affecting badge or label
- [ ] Score values below 0 are clamped to 0; values above 100 are clamped to 100
- [ ] `aria-label` on the badge reads `"Health score <N> — <Label>"` for screen readers
- [ ] `HealthIndicatorProps` interface is exported and correctly typed
- [ ] `CustomerCard.tsx` can import `HealthIndicator` and remove its inline `healthColorClasses`/`healthLabel` helpers
- [ ] No console errors or warnings in development mode
- [ ] Passes TypeScript strict mode checks (`tsc --noEmit`)
- [ ] Consistent visual output on mobile (320px+), tablet (768px+), and desktop (1024px+)
