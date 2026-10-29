# Taskly

Personal single-user task manager with a Hebrew (RTL) interface. Vanilla JS (Vite) + Supabase + Vercel.

See `PLAN.md` for the phased plan and `docs/taskly-prd.docx` for full requirements.

- **Frontend:** Vanilla JavaScript (ES modules) + Vite, plain CSS
- **Database:** Supabase (Postgres) via `@supabase/supabase-js`
- **Hosting:** Vercel (static build)
- No auth, no app server, no Edge Functions.

## Features

- **Views:**
  - **היום** (due today or overdue, not done; the default), **הכל** and **הושלמו**, at `#/today`, `#/all` and `#/done`
  - one view per category at `#/category/<id>`, and **ללא קטגוריה** at `#/category/none`
- **Sidebar** (on the right from 1024px wide; below that, it opens from the ☰ menu button):
  - views and categories, each category with its color and open-task count
  - create, rename or recolor, and delete categories
  - deleting a category keeps its tasks and moves them to "ללא קטגוריה"
- **Quick add:** type a title and press Enter. Tasks added from Today are due today; tasks added in a category view get that category.
- **Task rows:** done checkbox, priority, "בתהליך" chip, due date, category tag. Overdue tasks are red; done tasks are struck through.
- **Edit drawer:** title, description, due date, priority, status and category, plus delete.
- **Undo delete:** deleting a task shows a "ביטול" (undo) button for 5 seconds, and `Ctrl/Cmd+Z` does the same. The task is only deleted on the server after those 5 seconds. Deleting a category still asks for confirmation, because it can't be undone.
- **Search and sort:** search the current view by title and description, and sort by due date, priority or created date.
- **Header counters:** open, overdue, and completed today.
- **Saving:** changes show immediately. If saving fails, the change is rolled back and a Hebrew error toast appears.
- **Dark mode:** follows the system setting by default. The ☾/☀ button in the header overrides it, and the choice is remembered in this browser.
- **Keyboard shortcuts** (they don't fire while you're typing in a field):

  | Key                             | Action                                  |
  | ------------------------------- | --------------------------------------- |
  | `n` (or `מ` on a Hebrew layout) | Focus the new-task field                |
  | `/` (or `.` on a Hebrew layout) | Focus search                            |
  | `Esc`                           | Close the drawer, a dialog, or the menu |
  | `Ctrl/Cmd+Z`                    | Undo the last task delete               |

- **Accessibility:**
  - a skip link at the top of the page
  - visible keyboard focus everywhere
  - Hebrew labels on all icon buttons
  - WCAG AA contrast in both themes
  - 44px touch targets on phones
  - animations turned off when the system asks for reduced motion

## App structure

The layers are strict: `ui → state → api`. `lib` is pure and never touches the DOM or Supabase.

```
index.html              RTL shell (lang="he" dir="rtl"), Rubik font
src/
  main.js               entry point: boots ui/app.js
  api/                  Supabase access. client.js is the only file that imports supabase-js
    tasks.js            listTasks / createTask / updateTask / deleteTask
    categories.js       listCategories / createCategory / updateCategory / deleteCategory
  state/
    store.js            tasks + categories, pub/sub; optimistic updates with per-item rollback
  ui/                   DOM rendering and events; user text via textContent only
    app.js              shell and layout; re-renders on store/route/search changes
    router.js           hash routing (parseHash / routeHash)
    sidebar.js          views + categories nav
    categoryDialog.js   create / edit / delete category (<dialog>)
    toolbar.js          search + sort
    counters.js         header counters
    taskList.js         rows, skeleton, empty, no-results and error states
    drawer.js           task edit drawer (<dialog>)
    mobileNav.js        menu button + off-canvas sidebar below 1024px
    theme.js            dark-mode toggle
    shortcuts.js        global keyboard shortcuts + hint
    toast.js            toasts, including the undo action
    quickAdd.js, dom.js
  lib/                  pure helpers, unit-tested
    dates.js            local "today", isOverdue, Hebrew due-date labels
    views.js            Today / All / Done / category filters and ordering
    query.js            search + sort; applyQuery = view -> search -> sort
    counters.js         open / overdue / completed-today / per-category counts
    theme.js            resolve the saved / system theme
    shortcuts.js        keyboard shortcut matching
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
