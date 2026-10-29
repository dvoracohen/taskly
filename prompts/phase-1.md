Read `PLAN.md` (and `docs/taskly-prd.docx` if you need detail). Implement **Phase 1 only: Core MVP — Task CRUD** for Taskly. Phase 0 is done and deployed. Do not start Phase 2 features (categories UI, sorting, search, counters).

## Context
- Personal single-user task manager. Hebrew UI, RTL. Vanilla JS (ES Modules) + Vite, plain CSS. Supabase via `@supabase/supabase-js`. Hosted on Vercel (auto-deploys from `main`).
- No auth. No AI. No app server, no Edge Functions.
- Database is ready from `0001_init.sql` (Supabase project "Test", `rwxsmtyvymwvuhxrpmmk`). No schema changes are expected in this phase. If one turns out to be needed, add it as a new migration `0002_*.sql`. Never edit `0001`.
- Strict layering (from `PLAN.md`): `ui/` → `state/` → `api/`. `ui` never imports `api`. Only `api/client.js` imports supabase-js. `lib/` holds pure, testable helpers.
- Today's `src/main.js` smoke screen calls `listTasks()` directly. Replace it with the real app, following the layering.

## Tasks
1. **API** `src/api/tasks.js`: `listTasks()`, `createTask({ title })`, `updateTask(id, patch)`, `deleteTask(id)`. Each one returns the saved row or throws. Select the columns the UI needs.
2. **State** `src/state/store.js`: an in-memory task store with subscribe/notify. Every mutation is optimistic: update the store first, call the API, and on error roll back to the previous state and emit an error the UI shows as a toast. A task created optimistically gets a temporary id that is replaced by the real id from the server.
3. **Lib** (pure, no DOM, no Supabase):
   - `src/lib/dates.js`: local "today" as `YYYY-MM-DD` in the browser's timezone, `isOverdue(task, today)`, and Hebrew date formatting.
   - `src/lib/views.js`: `filterToday(tasks, today)` returns tasks that are not done and whose due date is today or earlier. `filterAll` and `filterDone` are the other two views. Use a sensible default order, for example by due date then created date. User-selectable sorting is Phase 2.
4. **Routing** `src/ui/router.js`: hash routes `#/today` (default; empty or unknown hash redirects here), `#/all`, `#/done`. The navigation shows the active view. `#/category/:id` is Phase 2.
5. **UI** (`src/ui/`), all text in Hebrew, user data rendered with `textContent` only:
   - **Quick add:** a text field at the top. Enter saves. An empty or whitespace-only title is blocked with an inline hint. Titles are capped at 200 characters.
   - **Task row:** checkbox (toggles `done` ↔ `todo`), title, priority indicator (low/medium/high), due date. Overdue tasks are red; done tasks are struck through and grey. Clicking the row opens the edit drawer.
   - **Edit drawer:** title, description (≤2000), due date, priority, status (`todo` / `in_progress` / `done`), with Save, Cancel and Delete. It closes on Save, Cancel or Esc, and focus returns to the row.
   - **Delete:** ask for confirmation before deleting. A native `confirm()` or a small dialog are both fine; Undo is Phase 3.
   - **Feedback:** a short success toast and a Hebrew error toast on failure (with rollback). A loading skeleton on first load.
   - **Empty states:** a friendly message in each view, plus a button such as "הוסף משימה ראשונה" that focuses the quick-add field.
6. **Tests:** add Vitest with an npm `test` script. Unit-test `filterToday` and `isOverdue`: due yesterday, today and tomorrow, no due date, done tasks, and a date near midnight.
7. **Docs:** update `README.md` (the `test` script, a short description of the app structure).

## Acceptance Criteria
- Create, edit, status change and delete all persist across a page refresh.
- A simulated network failure (DevTools → Offline) shows an error toast and restores the previous UI state.
- The Today view logic is covered by passing unit tests in `lib/` (`npm test`).
- `npm run lint`, `npm test` and `npm run build` pass. No console errors in the browser.
- `ui/` never imports from `api/` (check with a grep).
- Supabase security advisors still show no findings.

## Process
Work in Plan mode first: show me the plan (files to create/change, the store's API, and how optimistic updates with rollback work) and wait for my approval before writing files. Work on a branch `phase-1`, commit in logical steps, push the branch, and open a pull request to `main` so Vercel creates a preview deployment I can check before merging.
