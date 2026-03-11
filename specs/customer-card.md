# Feature: CustomerCard Component

## Context
- Individual customer display component for the Customer Intelligence Dashboard
- Used within the `CustomerSelector` container component to list available customers
- Provides at-a-glance customer information for quick identification and selection
- Foundation for domain health monitoring integration — surfaces domains associated with each customer

## Requirements

### Functional Requirements
- Display customer name, company name, and health score
- Show customer domains (websites) for health monitoring context
- Apply color-coded health indicator based on score:
  - Red (0–30): Poor health
  - Yellow (31–70): Moderate health
  - Green (71–100): Good health
- Display domain count badge when a customer has multiple domains
- Support basic responsive layout for mobile and desktop viewports

### User Interface Requirements
- Card-based visual design with clear separation between customer identity and domain information
- Health score rendered as a colored badge or indicator alongside the numeric value
- Domain list rendered inline; when more than one domain exists, show a count (e.g. "+2 more" or "3 domains")
- Hover/focus state to indicate the card is interactive (selectable)

### Data Requirements
- Accepts a single `Customer` object imported from `src/data/mock-customers.ts`
- `Customer` interface shape:
  ```ts
  interface Customer {
    id: string;
    name: string;
    company: string;
    healthScore: number;       // 0–100
    email?: string;
    subscriptionTier?: 'basic' | 'premium' | 'enterprise';
    domains?: string[];        // optional array of website URLs
    createdAt?: string;
    updatedAt?: string;
  }
  ```
- `domains` is optional; render domain section only when present and non-empty

### Integration Requirements
- Consumed by `CustomerSelector`; parent controls selection state
- Accepts an `onSelect` callback invoked with the customer `id` when the card is clicked
- Accepts an `isSelected` boolean prop to reflect active selection styling
- No internal data fetching — all data passed via props

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19
- TypeScript with strict mode
- Tailwind CSS for styling

### Performance Requirements
- Pure presentational component — no side effects or data fetching
- No runtime style computation; health color determined by a pure mapping function using Tailwind class names

### Design Constraints
- Responsive: full-width on mobile, fixed or fluid card width on desktop
- Minimum touch target for the card: 44px height
- Health indicator colors must meet WCAG 2.1 AA contrast ratios
- Consistent with Tailwind spacing and color scales used in the project

### File Structure and Naming
- Component file: `src/components/CustomerCard.tsx`
- Props interface: `CustomerCardProps` exported from component file
- Follow project naming conventions (PascalCase for components)

### Security Considerations
- No `dangerouslySetInnerHTML` usage
- Domain strings rendered as plain text, not as anchor `href` values, unless explicitly linked
- Proper TypeScript types prevent unexpected prop injection

## Acceptance Criteria

- [ ] Renders customer name and company name
- [ ] Renders health score with correct color: red (0–30), yellow (31–70), green (71–100)
- [ ] Renders domain list when `domains` array is present and non-empty
- [ ] Shows domain count indicator when customer has multiple domains
- [ ] Renders nothing for the domain section when `domains` is absent or empty
- [ ] `onSelect` callback is invoked with the correct customer `id` on click
- [ ] `isSelected=true` applies a distinct selected/active visual style
- [ ] Responsive layout works on mobile and desktop viewports
- [ ] `CustomerCardProps` interface exported and usable by consumers
- [ ] Passes TypeScript strict mode checks
- [ ] No console errors or warnings
