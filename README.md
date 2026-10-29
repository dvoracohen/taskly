# Taskly

Personal single-user task manager with a Hebrew (RTL) interface. Vanilla JS (Vite) + Supabase + Vercel.

See `PLAN.md` for the phased plan and `docs/taskly-prd.docx` for full requirements.

- **Frontend:** Vanilla JavaScript (ES modules) + Vite, plain CSS
- **Database:** Supabase (Postgres) via `@supabase/supabase-js`
- **Hosting:** Vercel (static build)
- No auth, no app server, no Edge Functions.

## Features (Phase 1)

- Views: **היום** (due today or overdue, not done; the default), **הכל** and **הושלמו**, at `#/today`, `#/all` and `#/done`
- Quick add: type a title and press Enter. Tasks added from Today are due today.
- Task rows: done checkbox, priority, "בתהליך" chip, due date. Overdue tasks are red; done tasks are struck through.
- Edit drawer: title, description, due date, priority and status, plus delete with confirmation
- Changes show immediately. If saving fails, the change is rolled back and a Hebrew error toast appears.

## App structure

The layers are strict: `ui → state → api`. `lib` is pure and never touches the DOM or Supabase.

```
index.html              RTL shell (lang="he" dir="rtl"), Rubik font
src/
  main.js               entry point: boots ui/app.js
  api/                  Supabase access. client.js is the only file that imports supabase-js
    tasks.js            listTasks / createTask / updateTask / deleteTask
  state/
    store.js            task store + pub/sub; optimistic updates with per-item rollback
  ui/                   DOM rendering and events; user text via textContent only
    app.js              shell, nav, re-render on store/route change
    router.js           hash routing
    taskList.js         rows, skeleton, empty and error states
    drawer.js           edit drawer (<dialog>)
    quickAdd.js, toast.js, dom.js
  lib/                  pure helpers, unit-tested
    dates.js            local "today", isOverdue, Hebrew due-date labels
    views.js            Today / All / Done filters and ordering
  styles/               plain CSS
supabase/migrations/    SQL migrations, applied in order
prompts/                the prompt used for each development phase
```

`ui/` must never import from `api/`. To check:

```bash
grep -rn "from '../api" src/ui
```

## Local setup

Prerequisites: Node.js 20+ and a Supabase project.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your local env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in `.env.local` from **Supabase → Project Settings → API**:
   - `VITE_SUPABASE_URL`: the Project URL
   - `VITE_SUPABASE_ANON_KEY`: the **publishable** key (`sb_publishable_…`) or the legacy **anon** key

   Never use the `service_role` / secret key. Every `VITE_*` variable ends up in the browser bundle.
   `.env.local` is gitignored.

4. Run the database migration (see below).
5. Start the dev server:
   ```bash
   npm run dev
   ```

### npm scripts

| Script            | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the Vite dev server          |
| `npm run build`   | Production build into `dist/`      |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Run ESLint                         |
| `npm test`        | Run unit tests (Vitest)            |
| `npm run format`  | Format all files with Prettier     |

## Database migration

Migrations live in `supabase/migrations/` and must run in filename order.

**Supabase SQL Editor:**

1. Open your project → **SQL Editor** → **New query**.
2. Paste the full contents of `supabase/migrations/0001_init.sql`.
3. Click **Run**. You should see "Success. No rows returned".
4. Check **Table Editor**: `categories` and `tasks` exist, and both show RLS as enabled.
5. Optionally, open **Advisors → Security Advisor**. It should not report "RLS disabled".

`0001_init.sql` creates the following:

- the `categories` and `tasks` tables
- indexes on `tasks(status, due_date)` and `tasks(category_id)`
- the `set_updated_at` and `set_completed_at` triggers
- RLS on both tables, with policies that give the `anon` role full CRUD on these two tables only

That access is intentional: this is a no-auth, single-user app. Anyone who has the URL and the publishable key can read and write tasks, so don't store sensitive data in it.

### Quick smoke test

Insert a row in **Table Editor → tasks** (only `title` is required) and refresh the app. The title should appear.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project** → import the GitHub repo.
3. Framework preset: **Vite** (detected automatically).
4. Build command: `npm run build`. Output directory: `dist`.
5. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values as in `.env.local`, for Production and Preview.
6. Click **Deploy**. Later pushes to `main` redeploy automatically.

If you change an environment variable later, redeploy. Vite inlines the values at build time.
