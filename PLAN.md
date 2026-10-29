# Project: Taskly

## Overview
Taskly is a personal, single-user task manager web app. It lets one person capture, organize, prioritize
and track tasks from desktop or phone with zero sign-up friction. Hebrew RTL UI. No auth, no AI.
Full requirements: `docs/taskly-prd.docx`.

## Tech Stack
- Frontend: Vanilla JavaScript (ES Modules) + Vite, plain CSS (custom properties)
- Backend: Supabase (Postgres + PostgREST via `@supabase/supabase-js`) — no app server, no Edge Functions
- Database: Supabase Postgres, schema managed by SQL migrations in `supabase/migrations/`
- AI: none
- Auth: none (single user; anon key + RLS policies scoped to two tables)
- Hosting: Vercel (static build, Git integration, preview deploys per branch)

## Architecture
- Browser SPA talks directly to Supabase REST using the anon (publishable) key.
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Vercel + local `.env.local`, never committed).
  The `service_role` key must never appear in client code.
- Hash routing: `#/today`, `#/all`, `#/done`, `#/category/:id`.
- Strict layering in `src/`:
  - `api/` — the only place that imports supabase-js (`tasks.js`, `categories.js`)
  - `state/` — in-memory store + pub/sub; optimistic updates with rollback on error
  - `ui/` — rendering & DOM events; user text rendered via `textContent` only (no `innerHTML` with data)
  - `lib/` — pure helpers (dates, filtering, sorting) — unit-testable
- `ui` never calls `api` directly; it goes through `state`.

## Data Model
| Table | Key fields | Notes |
|-------|-----------|-------|
| `categories` | `id uuid PK`, `name text unique (1–50)`, `color text default '#6B7280'`, `created_at` | |
| `tasks` | `id uuid PK`, `title text (1–200)`, `description text (≤2000)`, `status text` (`todo`/`in_progress`/`done`), `priority text` (`low`/`medium`/`high`), `due_date date`, `category_id uuid FK → categories ON DELETE SET NULL`, `completed_at`, `created_at`, `updated_at` | CHECK constraints on enums & lengths |

- Indexes: `tasks(status, due_date)`, `tasks(category_id)`.
- Triggers: `set_updated_at` (tasks), `set_completed_at` (set when status → done, cleared otherwise).
- RLS enabled on both tables; policies grant `anon` select/insert/update/delete on these two tables only.

## Development Phases

### Phase 0: Project Setup & Foundation
**Objective:** A deployed skeleton that reads from Supabase.
**Features:**
- Vite vanilla project, folder structure above, ESLint + Prettier, `index.html` with `lang="he" dir="rtl"`
- Supabase project (EU region); migration `0001_init.sql` with tables, constraints, indexes, triggers, RLS
- `src/api/client.js` creating the Supabase client from env vars (fail loudly if missing)
- `.env.example`, README setup steps; connect GitHub repo to Vercel, set env vars
**Acceptance Criteria:**
- A row inserted manually in Supabase appears in the deployed Vercel app
- Supabase Advisors show no "RLS disabled" warnings
- No secrets committed (`.env.local` gitignored)

### Phase 1: Core MVP — Task CRUD
**Objective:** Fully manage tasks with statuses.
**Features:**
- Quick-add input (Enter to save, empty title blocked)
- Task row: checkbox, title, priority indicator, due date; overdue in red, done struck-through
- Edit drawer: title, description, due date, priority, status
- Delete with confirmation
- Views: Today (due today or overdue, not done) — default; All; Done
- Optimistic updates with rollback + Hebrew error toast; loading skeleton; empty states
**Acceptance Criteria:**
- All CRUD operations persist across refresh
- Simulated network failure (DevTools offline) shows an error toast and restores prior UI state
- Today view logic covered by unit tests in `lib/`

### Phase 2: Organization & Findability
**Objective:** Keep many tasks organized and easy to find.
**Features:**
- Categories CRUD with color picker; sidebar list with counts; `#/category/:id` view
- Assign category in edit drawer; deleting a category moves its tasks to "uncategorized"
- Sort by due date / priority / created date; client-side search on title + description
- Header counters: open, overdue, completed today
**Acceptance Criteria:**
- Deleting a category leaves its tasks intact with `category_id = null`
- Search updates results within 300ms for 500 tasks
- Sort/filter/search combine correctly (unit tests in `lib/`)

### Phase 3: UX Polish
**Objective:** Make daily use fast and pleasant on every device.
**Features:**
- Dark mode (system preference + manual toggle, persisted in `localStorage`)
- Undo delete (5-second toast), keyboard shortcuts (`n` new task, `/` search, `Esc` close)
- Mobile: collapsible sidebar (hamburger), 44px touch targets; breakpoints 640px / 1024px
- Accessibility pass: focus states, aria-labels on icon buttons, WCAG AA contrast
**Acceptance Criteria:**
- Lighthouse Accessibility ≥ 90 on mobile and desktop
- Every action reachable by keyboard only
- No horizontal scroll at 360px width

### Phase 4: Production Readiness
**Objective:** Stability, performance and basic safeguards.
**Features:**
- Vitest unit tests for `lib/` and `state/` (api mocked)
- JSON export of all tasks + categories (backup)
- Vercel Analytics; bundle size check
- Run Supabase security & performance advisors and fix findings
- Optional: Vercel Deployment Protection to limit who can open the URL
**Acceptance Criteria:**
- `npm test` passes; `npm run build` produces < 100KB gzipped JS
- Lighthouse Performance ≥ 90; no critical Supabase advisor findings
- README documents setup, env vars, migrations and restoring a paused Supabase project

## Risks & Mitigations
- **Public data (no auth):** anyone with the URL + anon key can read/write tasks → store nothing sensitive,
  keep URL private, consider Vercel Deployment Protection; schema is ready for a future `user_id` + Supabase Auth.
- **Free Supabase project pauses after inactivity:** use regularly or upgrade; document restore steps.
- **Vanilla JS sprawl:** enforce `api/state/ui/lib` layering; no direct Supabase calls from `ui/`.
- **Accidental deletion:** confirm dialog, undo toast (Phase 3), JSON export (Phase 4).
- **Feature creep (subtasks, reminders, sharing):** new features go into the PRD first, then a new phase.
