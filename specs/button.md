# Feature: Button Component

## Context
- Reusable interactive action element for the Customer Intelligence Dashboard
- Used across the application for primary actions, secondary actions, and destructive operations
- Consumed by forms, modals, cards, and navigation elements
- Supports keyboard navigation and screen readers for accessibility

## Requirements

### Functional Requirements
- Trigger onClick callback when clicked
- Support disabled state that prevents interaction
- Support loading state that shows a spinner and prevents interaction
- Render as `<button>` element by default

### User Interface Requirements
- Variants:
  - `primary`: solid background (blue), white text — main call-to-action
  - `secondary`: outlined border, colored text — secondary actions
  - `danger`: solid red background — destructive actions
  - `ghost`: no background or border, colored text — low-emphasis actions
- Sizes: `sm`, `md` (default), `lg`
- Loading state: spinner replaces or precedes label text
- Disabled state: reduced opacity, `not-allowed` cursor
- Hover and focus-visible styles for interactivity feedback

### Data Requirements
- `children`: button label (React node)
- `variant`: `"primary" | "secondary" | "danger" | "ghost"` (default: `"primary"`)
- `size`: `"sm" | "md" | "lg"` (default: `"md"`)
- `isLoading`: boolean (default: `false`)
- `disabled`: boolean (default: `false`)
- `onClick`: optional click handler
- `type`: `"button" | "submit" | "reset"` (default: `"button"`)
- Spreads additional HTML button attributes via `React.ComponentPropsWithoutRef<"button">`

### Integration Requirements
- Drop-in replacement anywhere a `<button>` is needed
- Compatible with forms (supports `type="submit"`)
- Works inside flex and grid layouts without special wrapper

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19
- TypeScript with strict mode
- Tailwind CSS for styling

### Performance Requirements
- No unnecessary re-renders (stable prop references)
- No runtime style computation — pure Tailwind class mapping

### Design Constraints
- Minimum touch target: 44×44px on mobile
- Consistent with Tailwind spacing and color scales used in the project
- Focus ring must be visible for keyboard navigation (WCAG 2.1 AA)

### File Structure and Naming
- Component file: `components/Button.tsx`
- Props interface: `ButtonProps` exported from component file
- Follow project naming conventions (PascalCase for components)

### Security Considerations
- Default `type="button"` to prevent accidental form submissions
- No `dangerouslySetInnerHTML` usage
- Proper TypeScript types prevent unexpected prop injection

## Acceptance Criteria

- [ ] Renders all four variants with correct Tailwind styles
- [ ] Renders all three sizes with correct padding and font size
- [ ] `isLoading=true` shows spinner and disables interaction
- [ ] `disabled=true` applies reduced opacity and `cursor-not-allowed`
- [ ] `onClick` fires on click when not disabled and not loading
- [ ] Accessible: proper `aria-disabled`, `aria-busy`, and focus-visible ring
- [ ] Works as `type="submit"` inside a form
- [ ] `ButtonProps` interface exported and usable by consumers
- [ ] Passes TypeScript strict mode checks
- [ ] No console errors or warnings
