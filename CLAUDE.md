# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MPIS (Madrid Palamboon Information System) is a social welfare management web app for tracking assistance programs, beneficiary accounts, pharmacies, and users for a municipality in the Philippines. It uses **Base44 BaaS** (Backend-as-a-Service) for the backend and a **React + Vite** frontend.

## Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint (quiet mode)
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # TypeScript type checking via jsconfig.json
```

## Environment

Requires a `.env.local` file with:
```
VITE_BASE44_APP_ID=<app_id>
VITE_BASE44_APP_BASE_URL=<backend_url>
```

Runtime parameters can also come from URL search params or localStorage (see `src/lib/app-params.js`).

## Architecture

### Tech Stack
- **React 18** with Vite 6, React Router 6, React Query 5
- **Base44 SDK** (`@base44/sdk`) for all backend data operations
- **Shadcn/ui** (Radix UI primitives + Tailwind CSS) for the component library
- **React Hook Form + Zod** for form handling and validation

### Data Layer
All data flows through the Base44 SDK client (`src/api/base44Client.js`). Four entity types:
- **Account** — beneficiary records (personal info, address, family composition, target sectors)
- **Assistance** — aid records linked to accounts (type, amount, pharmacy, date)
- **Pharmacy** — registered pharmacies
- **User** — app users with roles

Entity operations: `.list()`, `.get()`, `.create()`, `.update()`, `.delete()`. React Query handles caching and invalidation.

### Routing & Pages
Routes are defined in `src/pages.config.js` and dynamically generated in `src/App.jsx`. Each page maps to a component in `src/pages/`. URL query params drive page state (e.g., `AccountView?id=123`).

Key pages: Dashboard, Accounts, AccountForm, AccountView, Users, Pharmacies, SourceOfFunds, FlexibleReports, BarangayReports, Reports, Settings.

### Layout & Navigation
`src/Layout.jsx` wraps all pages with a responsive sidebar (collapsible on mobile), header with global search, and footer. Navigation items are filtered by user role (`admin` vs `user`).

### Authentication & RBAC
`src/lib/AuthContext.jsx` manages auth state via Base44 SDK. Flow: check public settings → validate token → set user state. Two roles:
- **admin**: access to all pages including Pharmacies, SourceOfFunds, Reports, Users, Settings
- **user**: access to Dashboard and Accounts only

### Global Contexts
- **AuthContext** (`src/lib/AuthContext.jsx`) — authentication state
- **ThemeContext** — dark mode + 6 color themes (blue, purple, green, orange, pink, teal), persisted to localStorage
- **LanguageContext** — bilingual support (English/Cebuano), persisted to localStorage

### Path Aliases
`@/*` resolves to `./src/*` (configured in `jsconfig.json`).

### Styling
Tailwind CSS with HSL CSS variables for theming. Glass morphism design pattern (semi-transparent backgrounds, backdrop blur). Dark mode via class strategy. Print-specific CSS rules for generating intake sheets and application forms.

## Linting Scope
ESLint is configured to lint `src/components/` and `src/pages/` only — it excludes `src/components/ui/` (shadcn) and `src/lib/`. Enforces React Hooks rules and unused imports detection.

## Deployment
Push to GitHub → changes sync to Base44 Builder → click "Publish" on Base44.com to deploy. No CI/CD pipeline in the repo.

## Key Domain Context
- **Barangays**: 25 subdivisions of Madrid municipality (Bayogo, Beto, Calabcab, etc.)
- **Target Sectors**: FHONA, WEDC, YOUTH, PWD, SC, PLHIV, CHILD
- Accounts include family composition, representative info, and assistance history
