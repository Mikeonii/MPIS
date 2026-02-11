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

## Feature Locks (IMPORTANT - Read Before Modifying Code)

A feature lock inventory is maintained at `.feature-locks.json`. Before modifying any file, check if it is covered by an active lock. Locked files must NOT be edited without explicit user approval to unlock.

### Active Locks

**LOCK-001: Print Form Headers - Dual Logo Layout**
- **Status**: LOCKED (strict)
- **Locked files** (header sections only):
  - `src/components/print/GeneralIntakeSheet.jsx` (lines 41-59)
  - `src/components/print/CertificateOfEligibility.jsx` (lines 28-51)
  - `src/components/print/GuaranteeLetter.jsx` (lines 29-52)
- **Protected assets**: `public/logo.png`, `public/mp.png`
- **Reason**: Finalized dual-logo header layout (Madrid Seal left, MP logo right). Do NOT modify header markup, image sources, or logo styling without explicit unlock approval.
- **Scope**: Only the header sections are locked. Body and footer content may be modified freely.
- **Shared resource warning**: `public/logo.png` is also used by `Layout.jsx` and `Login.jsx`. Do NOT rename or remove it.

**LOCK-002: Medicine Price and Unit per Assistance**
- **Status**: LOCKED (strict)
- **Locked files and sections**:
  - `../mpis-api/app/Http/Controllers/AssistanceController.php` (lines 52-58) -- medicines.*.unit and medicines.*.price validation
  - `../mpis-api/app/Models/Assistance.php` (lines 14, 29) -- medicines fillable field and JSON array cast
  - `src/components/accounts/AssistanceForm.jsx` (lines 48-49, 198-231, 549-581, 619-701) -- medicineUnit/medicinePrice state, addMedicine() with unit/price, getMedicineTotal(), unit dropdown, price input, medicine item display with subtotals, "Use as Amount" button
  - `src/pages/AccountView.jsx` (lines 567-606) -- medicine details row in Assistance History showing name, qty, unit, price, subtotal
  - `src/components/print/GuaranteeLetter.jsx` (lines 89-159) -- medicines table with Qty/Unit/Price/Subtotal columns and Grand Total (body only, header locked by LOCK-001)
  - `src/components/print/CertificateOfEligibility.jsx` (lines 59-85) -- body section with medicines intentionally REMOVED; do NOT re-add medicines here
  - `src/pages/FlexibleReports.jsx` (lines 55-69, 96-103, 251-261, 554-562) -- medicine extraction, filtering, and display for object format { name, quantity, unit, price }
- **Data contract**: Medicines stored as JSON array of `{ name, quantity, unit, price }` objects. All display code handles both this format and legacy string format.
- **Reason**: Full-stack medicine price/unit feature finalized across backend validation, form input, display, print, and reports. Locking to prevent regression of the structured object format, calculation logic, and the intentional removal of medicines from the Certificate of Eligibility.
- **Multi-lock warning**: `GuaranteeLetter.jsx` and `CertificateOfEligibility.jsx` each have TWO active locks (LOCK-001 for header, LOCK-002 for body sections). Check BOTH locks before modifying these files.

### Lock Enforcement Rules
1. Before editing any file listed in `.feature-locks.json`, check for active locks on the specific sections being modified
2. If a locked section would be affected, STOP and warn the user before proceeding
3. Require explicit "unlock" confirmation before making changes to locked sections
4. After unlocking and making changes, remind the user to re-lock if appropriate
5. Files with multiple locks (GuaranteeLetter.jsx, CertificateOfEligibility.jsx) require checking ALL applicable locks before any modification

## Legacy (deprecated)
- `server/` directory (old Express + SQLite backend) — replaced by `mpis-api/`
- `src/api/base44Client.js` — unused, safe to delete
- `README.md` references old Base44 BaaS — no longer applicable
