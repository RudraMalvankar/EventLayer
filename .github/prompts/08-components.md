# Stage 08: Core UI Components

## Purpose
Build reusable UI components for event discovery, filtering, search, navigation, and save actions.

## Inputs/Dependencies
- Depends on canonical event shape and Stage 07 APIs.
- Stack: Next.js App Router + Tailwind.

## Required Outputs
Create components:
- `/components/EventCard.jsx`
  - props: `{ event, onSave, isSaved }`
  - includes banner, platform badge, mode badge, title, metadata, tags, free/paid badge, save button, register button
- `/components/FilterBar.jsx`
  - props: `{ filters, onChange }`
  - category/mode/price pills + city input
- `/components/SearchBar.jsx`
  - props: `{ onSearch, loading }`
  - natural-language search input and loading state
- `/components/Navbar.jsx`
  - brand, nav links, auth state actions, mobile menu

Visual direction:
- dark base: `bg-zinc-950`
- cards: `bg-zinc-900`
- accent: `text-cyan-400`

## Constraints
- JavaScript only.
- Named component exports.
- Maintain UX parity between desktop and mobile.

## Acceptance Checks
- Components are composable and API-ready.
- Save/search/filter interactions have clear callback contracts.
- Empty/loading-friendly states are possible in page-level composition.
