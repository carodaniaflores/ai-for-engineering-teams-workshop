Implement a React component from a specification file.

**Usage:** `/implement specs/component-name-spec.md`

**Steps:**

1. Parse the spec file path from: $ARGUMENTS
   - Resolve the path relative to the project root
   - Derive the component name (PascalCase) from the spec filename
     (e.g., `customer-card-spec.md` → `CustomerCard`)

2. Read the full spec file — treat every requirement and acceptance criterion as a binding contract

3. Examine the existing codebase for context:
   - Read `src/data/mock-customers.ts` to understand data structures
   - Read existing components in `src/components/` for style patterns
   - Read `src/app/page.tsx` to understand how components are consumed
   - Check `src/services/` for any relevant service files

4. Plan the implementation before writing:
   - List all TypeScript interfaces needed
   - List all props required
   - Note color-coding logic, responsive breakpoints, or special behaviors from the spec
   - Identify any sub-components needed

5. Generate the component at `src/components/[ComponentName].tsx`:
   - Use TypeScript with strict mode (no `any`, export all interfaces)
   - Use Tailwind CSS exclusively for styling (no inline styles, no CSS modules)
   - Follow React 19 / Next.js 15 patterns (functional components, hooks)
   - Apply responsive classes for mobile (default), tablet (`md:`), desktop (`lg:`)
   - Add `'use client'` directive only if needed (event handlers, hooks)
   - Sanitize any user-facing string output to prevent XSS
   - Use `React.memo` if the spec requires performance optimization

6. Verify each acceptance criterion from the spec against the generated code:
   - For each criterion, state: PASS / FAIL / PARTIAL with a brief reason
   - If any criterion FAILs or is PARTIAL, revise the component to fix it
   - Repeat verification until all criteria pass

7. Run a final check:
   - All exported TypeScript interfaces match what the spec requires
   - No hardcoded values that should come from props
   - No `console.log` or debug statements
   - Tailwind classes are valid and follow project conventions

8. Report:
   - Path of the generated component file
   - Acceptance criteria results (all must be PASS)
   - Any assumptions made where the spec was ambiguous
