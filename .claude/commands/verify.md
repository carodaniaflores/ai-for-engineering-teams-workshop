Verify a React component against its spec and project standards.

**Usage:** `/verify src/components/ComponentName.tsx`

**Steps:**

1. Parse the component file path from: $ARGUMENTS
   - Derive the component name (PascalCase) from the filename
   - Derive kebab-case name for finding the spec file
     (e.g., `CustomerCard.tsx` → `customer-card` → `specs/customer-card-spec.md`)

2. Read the component file in full

3. Locate and read the spec file at `specs/[kebab-name]-spec.md` (if it exists)
   - If no spec is found, verify against general project standards only and note the missing spec

4. Read `src/data/mock-customers.ts` to get mock data for render simulation

5. **TypeScript Check** — inspect the component source for:
   - [ ] All props are typed (no implicit `any`)
   - [ ] All interfaces are exported
   - [ ] Return type is valid JSX (`JSX.Element` or `React.ReactNode`)
   - [ ] No TypeScript errors visible in the code (use `mcp__ide__getDiagnostics` if available)
   - [ ] Strict mode compatible (no `!` non-null assertions on potentially null values)

6. **Render Simulation** — trace through the component logic with mock data:
   - Pick 2–3 representative mock customers (one per health tier if applicable)
   - Trace props → rendered output for each
   - Verify: correct fields displayed, correct color logic, no crash paths

7. **Responsive Design Check** — inspect Tailwind classes for:
   - [ ] Mobile-first base styles present (no breakpoint prefix = mobile default)
   - [ ] `md:` tablet breakpoint classes applied where spec requires layout changes
   - [ ] `lg:` desktop breakpoint classes applied where spec requires layout changes
   - [ ] No fixed pixel widths that would break at small viewports
   - [ ] Card/container max-width constraints from spec are implemented

8. **Spec Acceptance Criteria Check** (if spec found):
   - For each acceptance criterion, evaluate: PASS / FAIL / PARTIAL
   - Reference the specific line(s) of the component that satisfy or violate each criterion

9. **Code Quality Check**:
   - [ ] No `console.log` / `console.error` debug statements
   - [ ] No hardcoded data that should come from props
   - [ ] No inline `style={{}}` attributes (Tailwind only)
   - [ ] `'use client'` present only if component uses browser APIs or event handlers
   - [ ] Component is exported (default or named, consistent with spec)

10. **Summary Report** — output a structured pass/fail table:

```
VERIFICATION SUMMARY: ComponentName
====================================
TypeScript Types         [PASS/FAIL] <details>
Render with Mock Data    [PASS/FAIL] <details>
Responsive Design        [PASS/FAIL] <details>
Acceptance Criteria      [PASS/FAIL] X/Y criteria met
Code Quality             [PASS/FAIL] <details>
------------------------------------
OVERALL: PASS / FAIL
```

If any check FAILs, list specific issues with file line references so they can be fixed.
