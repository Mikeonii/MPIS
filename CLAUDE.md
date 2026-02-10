# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MPIS (Madrid Palamboon Information System) is a social welfare management app for tracking assistance programs, beneficiary accounts, pharmacies, and funding sources for a municipality in the Philippines. Monorepo workspace with two projects:

- **`mpis-client/`** — React frontend (Vite)
- **`mpis-api/`** — Laravel 12 backend API

## Commands

### Frontend (`mpis-client/`)
```bash
npm run dev          # Vite dev server on localhost:5173 (proxies /api to :8000)
npm run build        # Production build to dist/
npm run lint         # ESLint (quiet mode)
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # Type checking via jsconfig.json
```

### Backend (`mpis-api/`)
```bash
php artisan serve                    # Laravel dev server on localhost:8000
php artisan migrate                  # Run migrations
php artisan migrate:fresh --seed     # Reset DB with seed data
php artisan migrate:from-sqlite      # Import data from legacy SQLite DB
composer test                        # Run PHPUnit tests
```

### Running locally
Start both servers — frontend proxies `/api` requests to Laravel:
1. `cd mpis-api && php artisan serve` (port 8000)
2. `cd mpis-client && npm run dev` (port 5173)

## Architecture

### Frontend Stack
React 18, Vite 6, React Router 6, React Query 5, Shadcn/ui (Radix + Tailwind), React Hook Form + Zod, Lucide icons, Framer Motion, Recharts.

**Path alias:** `@/*` resolves to `./src/*`

### Backend Stack
Laravel 12, PHP 8.2+, Laravel Sanctum (token auth), MySQL (`mpis_db` via XAMPP, root, no password).

### Data Flow
Frontend → `src/api/client.js` (fetch wrapper with Bearer token) → Vite proxy `/api` → Laravel API on port 8000.

All entities in `src/api/entities.js` share the same interface: `.list(sort)`, `.get(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`, `.filter(filters, sort)`. React Query handles caching and invalidation.

### Authentication
- Laravel Sanctum issues Bearer tokens stored in localStorage (`mpis_access_token`)
- `src/lib/AuthContext.jsx` manages auth state, provides `useAuth()` hook
- 401 responses auto-clear token and redirect to `/login`
- Auth endpoints: `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`, `PUT /api/auth/change-password`, `POST /api/auth/logout`

### RBAC
Two roles: `admin` (full access) and `user` (Dashboard + Accounts only).
- Frontend: Navigation items filtered by role in `Layout.jsx`
- Backend: `admin` middleware on routes; non-admin users scoped to `created_by == user.email`
- Pharmacies and SourceOfFunds are readable by all roles, but CUD operations require admin

### Routing
Routes defined in `src/pages.config.js`, dynamically generated in `src/App.jsx`. Pages: Dashboard, Accounts, AccountForm, AccountView, Users, Pharmacies, SourceOfFunds, FlexibleReports, BarangayReports, Reports, Settings, Login.

### Global Contexts
- **AuthContext** — authentication state and user data
- **ThemeContext** — dark mode + 6 color themes, persisted to localStorage
- **LanguageContext** — bilingual English/Cebuano, persisted to localStorage

### Database (6 tables)
- `users` — app users with roles
- `accounts` — beneficiary records (49 fillable fields)
- `assistances` — aid records (FK to account, pharmacy, source_of_funds)
- `family_members` — linked to accounts
- `pharmacies` — registered pharmacies
- `source_of_funds` — funding with `amount_remaining` tracking

JSON columns: `sub_categories` and `medicines` (Eloquent JSON casts). Cascade deletes: account → assistances + family_members.

### Key Business Logic
- Creating an assistance deducts `amount` from `source_of_funds.amount_remaining`; sets status to 'Depleted' when remaining <= 0
- Batch family members: `POST /api/family-members/batch` (transactional)
- Cannot delete your own user account via the users endpoint
- Sort param format: `field` (asc) or `-field` (desc)

## Linting Scope
ESLint covers `src/components/**`, `src/pages/**`, and `src/Layout.jsx`. Excludes `src/components/ui/` (Shadcn generated) and `src/lib/`. Enforces React Hooks rules and unused imports detection.

## Styling
Tailwind CSS with HSL CSS variables for theming. Glass morphism design (semi-transparent backgrounds, `backdrop-blur`). Dark mode via class strategy. Print-specific CSS for intake sheets and application forms.

## Domain Context
- **Barangays**: 25 subdivisions of Madrid municipality
- **Target Sectors**: FHONA, WEDC, YOUTH, PWD, SC, PLHIV, CHILD
- Accounts track family composition, representative info, and assistance history

## Legacy (deprecated)
- `server/` directory (old Express + SQLite backend) — replaced by `mpis-api/`
- `src/api/base44Client.js` — unused, safe to delete
- `README.md` references old Base44 BaaS — no longer applicable
