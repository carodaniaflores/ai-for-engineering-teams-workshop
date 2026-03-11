Generate a specification file for a component.

**Usage:** `/spec ComponentName` (e.g., `/spec CustomerCard`)

**Steps:**

1. Parse the component name from: $ARGUMENTS
   - Convert to kebab-case for file names (e.g., `CustomerCard` → `customer-card`)
   - Keep PascalCase for component references

2. Check for a requirements file at `requirements/[kebab-name].md`
   - If found, read it fully — this is the source of truth for requirements
   - If not found, note that no requirements file exists and generate the spec based on the component name and project context

3. Read `templates/spec-template.md` to get the spec structure

4. Read `specs/customer-card-example.md` as a reference for the expected quality and format

5. Examine the existing codebase for context:
   - Check `src/components/` for related components
   - Check `src/data/mock-customers.ts` for relevant data structures
   - Check `src/app/` for how components are used

6. Generate a complete spec file at `specs/[kebab-name]-spec.md` following the template structure:

   ## Feature: [ComponentName] Component

   ### Context
   - Purpose and role in the application
   - How it fits into the larger system
   - Who will use it and when

   ### Requirements
   #### Functional Requirements
   - What the component must do

   #### User Interface Requirements
   - Visual design, color coding, layout

   #### Data Requirements
   - Props interface with TypeScript types
   - Data sources (e.g., mock-customers.ts)

   #### Integration Requirements
   - Parent components, data flow, exports

   ### Constraints
   #### Technical Stack
   - Next.js 15 (App Router), React 19, TypeScript strict mode, Tailwind CSS

   #### Performance Requirements
   - Rendering targets, re-render optimization

   #### Design Constraints
   - Responsive breakpoints, size limits, spacing

   #### File Structure and Naming
   - File path, interface names, naming conventions

   #### Security Considerations
   - XSS prevention, data exposure, type safety

   ### Acceptance Criteria
   - [ ] Testable, specific criteria derived from requirements
   - [ ] Edge cases handled
   - [ ] TypeScript types correct
   - [ ] Responsive design verified
   - [ ] No console errors or warnings

7. Save the spec to `specs/[kebab-name]-spec.md`

8. Report: path of saved spec, count of acceptance criteria, any requirements file used
