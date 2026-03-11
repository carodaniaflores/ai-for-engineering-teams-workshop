# Feature: HealthIndicator Unit Tests

## Context
- Unit test suite for the `HealthIndicator` component (`src/components/HealthIndicator.tsx`)
- Verifies the purely presentational health score display component in isolation
- Covers the score badge, progress bar, severity label, tier color logic, clamping behavior, and prop toggles
- Target audience: developers maintaining or extending the component

## Requirements

### Functional Requirements
- Test that the correct severity tier (Critical / Warning / Healthy) is applied for boundary and mid-range scores
- Test that scores outside 0–100 are clamped before rendering
- Test that `showLabel={false}` hides the severity label text
- Test that `showBar={false}` hides the progress bar element
- Test that both optional props default to `true` when omitted
- Test that a custom `className` is applied to the root wrapper element

### User Interface Requirements
- Assert the correct Tailwind badge classes (`bg-red-100 text-red-800`, `bg-yellow-100 text-yellow-800`, `bg-green-100 text-green-800`) for each tier
- Assert the correct bar fill classes (`bg-red-400`, `bg-yellow-400`, `bg-green-400`) for each tier
- Assert that the bar fill `style.width` equals `${score}%` for in-range scores
- Assert that the label text renders `"Critical"`, `"Warning"`, or `"Healthy"` as appropriate

### Data Requirements
- Props under test:

```ts
interface HealthIndicatorProps {
  score: number;        // 0–100 (clamped at boundaries)
  showLabel?: boolean;  // default true
  showBar?: boolean;    // default true
  className?: string;   // applied to root div
}
```

- No external data sources; all inputs supplied directly via props

### Integration Requirements
- Tests are self-contained; no mocking of external modules required
- Use React Testing Library (`@testing-library/react`) and Jest
- No snapshot tests — assert on specific DOM attributes and text content

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19
- TypeScript with strict mode
- Jest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Tailwind CSS class names validated as string assertions (not computed styles)

### Performance Requirements
- Each test must complete in < 100ms
- No async operations required (component is synchronous / purely presentational)

### Design Constraints
- Tests must not rely on implementation details (internal helper names, component display name)
- Query elements by ARIA roles or `aria-label` where possible; fall back to `data-testid` only if necessary
- One `describe` block per logical group (rendering, tier thresholds, clamping, prop toggles, accessibility)

### File Structure and Naming
- Test file: `src/components/__tests__/HealthIndicator.test.tsx`
- Import path: `../../HealthIndicator`
- Follow project PascalCase/camelCase conventions for `describe`/`it` labels

### Security Considerations
- No user-supplied strings rendered; no XSS surface to test
- TypeScript strict mode prevents invalid prop values at compile time; runtime boundary tests (clamping) are still required

## Acceptance Criteria

### Rendering
- [ ] Renders the numeric score inside the badge element for a mid-range score (e.g., 55)
- [ ] Renders both the badge and the progress bar by default (no props omitted)
- [ ] Renders the severity label text by default

### Tier Thresholds — Critical (0–30)
- [ ] Score 0 → badge classes `bg-red-100 text-red-800`, bar class `bg-red-400`, label `"Critical"`
- [ ] Score 30 → same red classes and label `"Critical"` (upper boundary of Critical)
- [ ] Score 15 → same red classes (mid-range Critical)

### Tier Thresholds — Warning (31–70)
- [ ] Score 31 → badge classes `bg-yellow-100 text-yellow-800`, bar class `bg-yellow-400`, label `"Warning"` (lower boundary of Warning)
- [ ] Score 70 → same yellow classes and label `"Warning"` (upper boundary of Warning)
- [ ] Score 50 → same yellow classes (mid-range Warning)

### Tier Thresholds — Healthy (71–100)
- [ ] Score 71 → badge classes `bg-green-100 text-green-800`, bar class `bg-green-400`, label `"Healthy"` (lower boundary of Healthy)
- [ ] Score 100 → same green classes and label `"Healthy"` (upper boundary)
- [ ] Score 85 → same green classes (mid-range Healthy)

### Clamping
- [ ] Score -10 → rendered score value is `0`, Critical tier applied
- [ ] Score 150 → rendered score value is `100`, Healthy tier applied
- [ ] Score 0 → bar fill width is `"0%"`
- [ ] Score 100 → bar fill width is `"100%"`

### Bar Width
- [ ] Score 55 → bar fill `style.width` is `"55%"`
- [ ] Score 30 → bar fill `style.width` is `"30%"`

### Prop: `showLabel`
- [ ] `showLabel={true}` (default) → label text is present in the DOM
- [ ] `showLabel={false}` → label text is absent from the DOM; badge and bar still render

### Prop: `showBar`
- [ ] `showBar={true}` (default) → progress bar element is present in the DOM
- [ ] `showBar={false}` → progress bar element is absent from the DOM; badge and label still render

### Prop: `className`
- [ ] Custom `className` string is added to the root wrapper `div`

### Accessibility
- [ ] Badge element has `aria-label` matching `"Health score <N> — <Label>"` for in-range scores
- [ ] Badge `aria-label` uses clamped value for out-of-range scores (e.g., score 150 → `"Health score 100 — Healthy"`)

### TypeScript
- [ ] Props interface `HealthIndicatorProps` is exported from `src/components/HealthIndicator.tsx`
- [ ] Test file passes `tsc --noEmit` with strict mode enabled
