# Feature: CustomerCard Unit Tests

## Context
- Unit test suite for the `CustomerCard` component (`src/components/CustomerCard.tsx`)
- Verifies rendering of customer data, health score color logic, subscription tier badges, domain display, selection state, keyboard interaction, and accessibility
- No external data fetching — all inputs supplied via the `Customer` prop shape from `src/data/mock-customers.ts`
- Target audience: developers maintaining or extending the Customer Intelligence Dashboard

## Requirements

### Functional Requirements
- Test that customer name, company, email, and health score are rendered
- Test that avatar initials are derived correctly from the customer name
- Test that the correct health tier colors (badge + border + bar) are applied at tier boundaries
- Test that the correct subscription tier badge style is applied for `enterprise`, `premium`, and `basic`
- Test that domains are displayed: first domain shown, extra count shown when > 1 domain
- Test that no domain row renders when `domains` is empty or undefined
- Test that `onSelect` is called with the customer `id` when clicked
- Test that `onSelect` is called when Enter or Space is pressed
- Test that `onSelect` is NOT called when neither Enter nor Space is pressed
- Test that the card reflects `isSelected` state (border color, `aria-pressed`)
- Test that `onSelect` and `isSelected` are optional (component renders without them)

### User Interface Requirements
- Assert correct Tailwind badge classes for each health tier:
  - Critical (0–30): `bg-red-100 text-red-800` badge, `border-red-400` border
  - Warning (31–70): `bg-yellow-100 text-yellow-800` badge, `border-yellow-400` border
  - Healthy (71–100): `bg-green-100 text-green-800` badge, `border-green-400` border
- Assert correct bar fill class (`bg-red-400` / `bg-yellow-400` / `bg-green-400`) for each tier
- Assert bar fill `style.width` equals `${healthScore}%`
- Assert correct tier badge classes: `bg-purple-100 text-purple-700` (enterprise), `bg-blue-100 text-blue-700` (premium), `bg-gray-100 text-gray-600` (basic)
- Assert unrecognised tier falls back to basic styles

### Data Requirements
- Use inline fixture objects matching the `Customer` interface — do not import `mockCustomers` array directly
- Minimum required fields per fixture: `id`, `name`, `company`, `healthScore`
- Optional fields under test: `subscriptionTier`, `domains`

```ts
// Customer interface (from src/data/mock-customers.ts)
interface Customer {
  id: string;
  name: string;
  company: string;
  healthScore: number;
  email?: string;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  domains?: string[];
  createdAt?: string;
  updatedAt?: string;
}
```

### Integration Requirements
- Tests are self-contained; no context providers or router wrappers required
- Use React Testing Library (`@testing-library/react`) and Jest
- Mock `onSelect` with `jest.fn()` — no real side effects
- No snapshot tests — assert specific DOM content, attributes, and class names

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19
- TypeScript with strict mode
- Jest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Tailwind class names validated as string assertions (not computed CSS)

### Performance Requirements
- All tests synchronous; no async operations needed
- Full suite should complete in < 2 seconds

### Design Constraints
- Query elements by ARIA role (`button`), `aria-label`, or visible text; avoid brittle CSS-class queries where possible
- One `describe` block per logical concern (rendering, health tiers, tier badges, domains, interaction, selection state, accessibility)
- Keep fixtures minimal — only include fields relevant to the test case

### File Structure and Naming
- Test file: `src/components/__tests__/CustomerCard.test.tsx`
- Import component: `../../CustomerCard`
- Import `Customer` type: `../../../data/mock-customers`
- Helper factory function `makeCustomer(overrides?: Partial<Customer>): Customer` for DRY fixture creation

### Security Considerations
- All rendered strings are static fixture values, not user input — no XSS surface to test here
- TypeScript strict mode prevents invalid prop types at compile time; still test runtime optional-prop paths

## Acceptance Criteria

### Rendering — Core Fields
- [ ] Renders `customer.name` as visible text
- [ ] Renders `customer.company` as visible text
- [ ] Renders `customer.healthScore` as visible numeric text inside the badge

### Avatar Initials
- [ ] Single-word name (e.g., `"Alice"`) → initials `"AL"` (first two chars, uppercased)
- [ ] Two-word name (e.g., `"John Smith"`) → initials `"JS"`
- [ ] Three-word name (e.g., `"Mary Jane Watson"`) → initials `"MJ"` (only first two words used)

### Health Tier — Critical (0–30)
- [ ] Score 0 → badge has classes `bg-red-100 text-red-800`, label text `"Critical"`, bar class `bg-red-400`
- [ ] Score 30 → same red classes and label (upper boundary of Critical)
- [ ] Score 15 → bar fill `style.width` is `"15%"`
- [ ] Score 30 → selected border class is `border-red-400`

### Health Tier — Warning (31–70)
- [ ] Score 31 → badge has classes `bg-yellow-100 text-yellow-800`, label text `"Warning"`, bar class `bg-yellow-400`
- [ ] Score 70 → same yellow classes and label (upper boundary of Warning)
- [ ] Score 55 → bar fill `style.width` is `"55%"`

### Health Tier — Healthy (71–100)
- [ ] Score 71 → badge has classes `bg-green-100 text-green-800`, label text `"Healthy"`, bar class `bg-green-400`
- [ ] Score 100 → same green classes and label
- [ ] Score 85 → bar fill `style.width` is `"85%"`

### Subscription Tier Badge
- [ ] `subscriptionTier: 'enterprise'` → badge has classes `bg-purple-100 text-purple-700` and text `"enterprise"`
- [ ] `subscriptionTier: 'premium'` → badge has classes `bg-blue-100 text-blue-700` and text `"premium"`
- [ ] `subscriptionTier: 'basic'` → badge has classes `bg-gray-100 text-gray-600` and text `"basic"`
- [ ] `subscriptionTier` undefined → falls back to basic styles (`bg-gray-100 text-gray-600`)

### Domain Display
- [ ] Single domain → first domain text is visible; no `+N` count shown
- [ ] Two domains → first domain text visible; `"+1"` count shown
- [ ] Three domains → first domain text visible; `"+2"` count shown
- [ ] `domains: []` → domain row is absent from the DOM
- [ ] `domains` undefined → domain row is absent from the DOM

### Interaction — onClick
- [ ] Clicking the card calls `onSelect` with `customer.id`
- [ ] `onSelect` is called exactly once per click
- [ ] Rendering without `onSelect` prop does not throw when card is clicked

### Interaction — Keyboard
- [ ] Pressing Enter calls `onSelect` with `customer.id`
- [ ] Pressing Space calls `onSelect` with `customer.id`
- [ ] Pressing Tab does NOT call `onSelect`
- [ ] Pressing Enter when `onSelect` is undefined does not throw

### Selection State
- [ ] `isSelected={false}` (default) → card has `border-gray-200` class; `aria-pressed` is `"false"`
- [ ] `isSelected={true}` → card does NOT have `border-gray-200`; `aria-pressed` is `"true"`
- [ ] `isSelected={true}` with Critical health → card has `border-red-400`
- [ ] `isSelected={true}` with Warning health → card has `border-yellow-400`
- [ ] `isSelected={true}` with Healthy health → card has `border-green-400`

### Accessibility
- [ ] Root element has `role="button"`
- [ ] Root element has `tabIndex={0}`
- [ ] Health score badge has `aria-label` matching `"Health score <N> — <Label>"`
- [ ] `aria-pressed` reflects `isSelected` prop value

### TypeScript
- [ ] `CustomerCardProps` interface is exported from `src/components/CustomerCard.tsx`
- [ ] Test file passes `tsc --noEmit` with strict mode enabled
