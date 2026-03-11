# Feature: Market Intelligence Widget

## Context
- Real-time market sentiment and news analysis widget for the Customer Intelligence Dashboard
- Displayed alongside Domain Health and Predictive Alerts widgets in the dashboard grid
- Receives company name from the selected customer; allows manual company name entry
- Demonstrates spec-driven context compression and component composition techniques
- Uses mock data generation for reliable, predictable workshop outcomes — no external API calls

## Requirements

### Functional Requirements
- Accept a company name as input (pre-populated from selected customer, editable by user)
- Fetch market intelligence from `/api/market-intelligence/[company]` on submit
- Display market sentiment with color-coded indicator (green = positive, yellow = neutral, red = negative)
- Show total news article count and last updated timestamp
- Display top 3 headlines with source and publication date
- Support loading state while fetching
- Support error state with user-friendly message and retry option
- Re-fetch when company name changes via prop

### User Interface Requirements
- Input field for company name with a "Get Intelligence" submit button
- Sentiment section: colored badge (green/yellow/red) + sentiment label + confidence percentage
- Article count displayed as a secondary stat
- Headlines list: title, source, and relative or formatted publication date per item
- Loading state: spinner or skeleton replacing the results area
- Error state: error message with a "Try Again" button
- Empty/initial state: prompt to enter a company name
- Consistent card-based layout, spacing, and typography matching other dashboard widgets

### Data Requirements
- API response shape (`MarketIntelligenceResponse`):
  ```ts
  interface MarketIntelligenceResponse {
    company: string;
    sentiment: {
      score: number;        // -1 to 1
      label: 'positive' | 'neutral' | 'negative';
      confidence: number;   // 0 to 1
    };
    articleCount: number;
    headlines: Array<{
      title: string;
      source: string;
      publishedAt: string;
    }>;
    lastUpdated: string;    // ISO 8601
  }
  ```
- API route uses `generateMockMarketData` and `calculateMockSentiment` from `src/data/mock-market-intelligence.ts`
- Service caches responses per company with 10-minute TTL

### Integration Requirements
- Props:
  ```ts
  interface MarketIntelligenceWidgetProps {
    company?: string;   // pre-populated from selected customer
  }
  ```
- No internal customer state — parent Dashboard passes `company` from selected customer
- Integrates into Dashboard grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Stateless regarding customer selection; reacts to `company` prop changes via `useEffect`

## Constraints

### Technical Stack
- Next.js 15 App Router with Route Handlers (`src/app/api/market-intelligence/[company]/route.ts`)
- React 19 with `useState` / `useEffect` hooks
- TypeScript with strict mode; all interfaces exported
- Tailwind CSS for styling — no inline styles

### Performance Requirements
- Server-side 10-minute TTL cache in `MarketIntelligenceService` (in-memory Map)
- Simulated API delay (300–600 ms) for authentic UX without blocking tests
- No unnecessary re-fetches — debounce or guard against empty company strings

### Design Constraints
- Sentiment color system matches project-wide health score palette:
  - Green (`positive`): `bg-green-100 text-green-800`
  - Yellow (`neutral`): `bg-yellow-100 text-yellow-800`
  - Red (`negative`): `bg-red-100 text-red-800`
- Consistent card wrapper: `rounded-lg border bg-white p-4 shadow-sm`
- Responsive: full-width on mobile, fits within dashboard grid columns on md+
- Focus rings on interactive elements (WCAG 2.1 AA)

### File Structure and Naming
- UI component: `src/components/MarketIntelligenceWidget.tsx`
- Props interface: `MarketIntelligenceWidgetProps` exported from component file
- API route handler: `src/app/api/market-intelligence/[company]/route.ts`
- Service class: `src/services/MarketIntelligenceService.ts`
- Custom error class: `MarketIntelligenceError` in service file
- Response type: `MarketIntelligenceResponse` in service or shared types file

### Security Considerations
- Validate and sanitize `company` path parameter in route handler (alphanumeric + spaces, max 100 chars)
- Return 400 for invalid or missing company name
- Error responses must not leak internal stack traces or service implementation details
- No `dangerouslySetInnerHTML`; all headline text rendered as plain text nodes
- Mock data generation prevents external API vulnerabilities

## Acceptance Criteria

- [ ] Renders input field pre-populated with `company` prop value when provided
- [ ] Fetches `/api/market-intelligence/[company]` on form submit and on `company` prop change
- [ ] Displays sentiment badge with correct color: green (positive), yellow (neutral), red (negative)
- [ ] Displays article count and formatted `lastUpdated` timestamp
- [ ] Displays exactly 3 headlines with title, source, and publication date
- [ ] Shows loading state (spinner or skeleton) while request is in flight
- [ ] Shows error state with message and "Try Again" button on fetch failure
- [ ] Does not fetch when company name input is empty
- [ ] API route returns 400 for invalid or missing company name
- [ ] API route returns valid `MarketIntelligenceResponse` JSON for a valid company name
- [ ] `MarketIntelligenceService` caches responses and returns cached data within 10-minute TTL
- [ ] `MarketIntelligenceError` is thrown and surfaced correctly on service errors
- [ ] Widget integrates into Dashboard grid without layout breakage
- [ ] All interfaces exported and usable by consumers
- [ ] Passes TypeScript strict mode checks with no errors
- [ ] No console errors or warnings in normal operation
