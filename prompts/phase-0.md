Read `PLAN.md` (and `docs/taskly-prd.docx` if you need detail). Implement **Phase 0 only: Project Setup & Foundation** for Taskly. Do not start Phase 1 features.

## Context
- Personal single-user task manager. Hebrew UI, RTL.
- Stack: Vanilla JavaScript (ES Modules) + Vite, plain CSS. Supabase (Postgres via `@supabase/supabase-js`). Hosted on Vercel.
- No auth. No AI. No app server, no Edge Functions.

## Tasks
1. **Scaffold** a Vite vanilla-JS project in the repo root (keep existing `PLAN.md`, `README.md`, `docs/`, `.gitignore`).
   - `index.html` with `<html lang="he" dir="rtl">`, Hebrew font (Rubik or Heebo via Google Fonts).
   - Folder structure: `src/api/`, `src/state/`, `src/ui/`, `src/lib/`, `src/styles/`, `supabase/migrations/`.
   - ESLint + Prettier configured; npm scripts: `dev`, `build`, `preview`, `lint`.
2. **Database migration** `supabase/migrations/0001_init.sql`:
   - `categories`: `id uuid pk default gen_random_uuid()`, `name text not null unique check (char_length(name) between 1 and 50)`, `color text not null default '#6B7280'`, `created_at timestamptz not null default now()`.
   - `tasks`: `id uuid pk`, `title text not null check (1–200 chars)`, `description text check (≤2000)`, `status text not null default 'todo' check (status in ('todo','in_progress','done'))`, `priority text not null default 'medium' check (priority in ('low','medium','high'))`, `due_date date`, `category_id uuid references categories(id) on delete set null`, `completed_at timestamptz`, `created_at`, `updated_at timestamptz not null default now()`.
   - Indexes: `tasks(status, due_date)`, `tasks(category_id)`.
   - Triggers: `set_updated_at` (before update on tasks); `set_completed_at` (sets `completed_at = now()` when status becomes `done`, clears it otherwise). Use `security invoker` functions with `set search_path = ''`.
   - Enable RLS on both tables. Policies granting role `anon` select/insert/update/delete on these two tables only.
   - If the Supabase MCP tools are available, apply the migration to my project and run the security advisors; otherwise give me exact steps to run it in the Supabase SQL editor.
3. **Supabase client** `src/api/client.js`: create the client from `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; throw a clear error if either is missing. This is the only file that imports supabase-js. Never use a `service_role` key.
4. **Smoke screen**: `src/api/tasks.js` with `listTasks()`; `src/main.js` renders the task titles into a list (using `textContent`, never `innerHTML` with data), plus a "no tasks yet" message and a Hebrew error message on failure.
5. **Config & docs**: `.env.example` with both variables; ensure `.env.local` is gitignored; update `README.md` with local setup, migration, and Vercel deploy steps (connect GitHub repo, set the two env vars, build command `npm run build`, output `dist`).

## Acceptance Criteria
- `npm run dev` shows the page RTL with no console errors.
- A row inserted manually into `tasks` in Supabase appears in the app after refresh.
- `npm run build` and `npm run lint` pass.
- Supabase advisors show no "RLS disabled" findings.
- No secrets committed.

## Process
Work in Plan mode first: show me the plan (files to create, migration SQL outline) and wait for my approval before writing files. Commit at the end with a clear message.
