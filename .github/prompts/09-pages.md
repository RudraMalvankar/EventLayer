# Stage 09: App Pages

## Purpose
Assemble final pages using shared components and API routes for feed, explore, event detail, and saved views.

## Inputs/Dependencies
- Depends on Stage 07 APIs and Stage 08 components.

## Required Outputs
Create pages:
- `/app/page.jsx` (Home Feed)
  - initial event load
  - filter/search integration
  - loading skeleton and empty state
- `/app/explore/page.jsx` (Explore)
  - query-driven AI search results
  - example prompt chips
  - human-readable applied filter summary
- `/app/events/[id]/page.jsx` (Event Detail)
  - full event rendering + register/save actions
- `/app/saved/page.jsx` (Saved Events)
  - auth-gated saved events grid with empty state

Use shared `Navbar` across pages.

## Constraints
- JavaScript only.
- Keep client/server component boundaries intentional.
- Preserve consistent field naming from APIs to UI.

## Acceptance Checks
- Search/filter state updates correctly trigger data refresh.
- Saved events flow is auth-aware and robust.
- All pages render valid states: loading, success, empty.
