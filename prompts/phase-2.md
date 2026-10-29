Read `PLAN.md` (and `docs/taskly-prd.docx` if you need detail). Implement **Phase 2 only: Organization & Findability** for Taskly. Phases 0 and 1 are done and live. Do not start Phase 3 features (dark mode, undo, keyboard shortcuts, mobile hamburger, accessibility pass).

## Context
- Personal single-user task manager. Hebrew UI, RTL. Vanilla JS (ES Modules) + Vite, plain CSS. Supabase via `@supabase/supabase-js`. Hosted on Vercel (auto-deploys from `main`).
- No auth. No AI. No app server, no Edge Functions.
- The `categories` table and `tasks.category_id` (`on delete set null`) already exist from `0001_init.sql`. No schema change is expected. If one turns out to be needed, add a new migration `0002_*.sql`.
- Keep the layering from Phase 1: `ui/` → `state/` → `api/`. `ui` never imports `api`. `lib/` is pure and unit-tested. Keep optimistic updates with per-item rollback and Hebrew error toasts for every new mutation.

## Tasks
1. **API** `src/api/categories.js`: `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`. Add `category_id` to the task columns in `src/api/tasks.js`.
2. **State:** the store also holds categories, with optimistic create, rename/recolor and delete.
   - Deleting a category also sets `category_id = null` locally on its tasks, to match the database's `on delete set null`. If the delete fails, both the category and those tasks are restored.
   - A duplicate category name is rejected by the database's unique constraint. Show it as a Hebrew error: "כבר קיימת קטגוריה בשם הזה".
3. **Sidebar** (desktop: on the right, the RTL start side; on narrow screens it stacks above the list, since the hamburger menu is Phase 3):
   - The views היום / הכל / הושלמו.
   - A categories list, each with its color dot and count of open tasks.
   - A "ללא קטגוריה" entry for tasks without a category.
   - "+ קטגוריה חדשה" to create a category.
   - Each category can be renamed, recolored with a color picker, or deleted with a confirmation that says its tasks will stay and become uncategorized.
4. **Routing:** `#/category/:id` and `#/category/none` (uncategorized). Category views show open tasks first, then done ones, like All. An unknown category id redirects to `#/today`.
5. **Tasks and categories:**
   - The task row shows a colored category tag. Use a dot plus neutral text so contrast stays readable for any color.
   - The edit drawer gets a category select, including "ללא קטגוריה".
   - Quick add inside a category view assigns that category.
6. **Sort:** a control for due date / priority / created date that applies to the current view. Keep the choice while the app is open.
7. **Search:** a field that filters the current view by title and description. It's client-side, case-insensitive and ignores surrounding whitespace. An empty search shows everything. Show a Hebrew "no results" state.
8. **Header counters:** open tasks, overdue tasks, and tasks completed today. "Today" is the local date, compared with `completed_at`.
9. **Lib and tests** (pure functions in `lib/`, Vitest):
   - sorting, search matching and counters
   - one combined pipeline (view filter → search → sort) with tests showing the three combine correctly
   - a test that searching 500 tasks takes well under 300ms
10. **Docs:** update the README's feature list and app structure.

## Acceptance Criteria
- Deleting a category leaves its tasks intact with `category_id = null`. Verify in the database, not only in the UI.
- Search updates results within 300ms for 500 tasks.
- Sort, filter and search combine correctly (unit tests in `lib/`).
- Category CRUD and task category assignment persist across refresh. A failed category mutation rolls back with an error toast.
- `npm run lint`, `npm test` and `npm run build` pass. No console errors. `ui/` never imports `api/`.
- Supabase security advisors show no findings.

## Process
Work in Plan mode first: show me the plan and wait for my approval before writing files. Cover the files to create or change, the store additions, how deleting a category stays consistent with the database, and the sidebar layout. Work on a branch `phase-2`, commit in logical steps, push, open a pull request to `main`, and check the Vercel preview before I decide on merging.
