Read `PLAN.md` (and `docs/taskly-prd.docx` if you need detail). Implement **Phase 3 only: UX Polish** for Taskly. Phases 0–2 are done and live. Do not start Phase 4 features (JSON export, Vercel Analytics, bundle checks, Deployment Protection).

## Context
- Personal single-user task manager. Hebrew UI, RTL. Vanilla JS (ES Modules) + Vite, plain CSS (custom properties). Supabase via `@supabase/supabase-js`. Hosted on Vercel (auto-deploys from `main`).
- No schema changes are expected.
- Keep the layering: `ui/` → `state/` → `api/`. `ui` never imports `api`. `lib/` is pure and unit-tested. Keep optimistic updates with rollback.
- PRD requirements for this phase:
  - mobile-first, with breakpoints at 640px and 1024px
  - touch targets of at least 44px on mobile
  - WCAG AA contrast
  - full keyboard navigation with visible focus
  - aria labels on every icon button
  - Lighthouse score above 90

## Tasks
1. **Dark mode:**
   - Follow the system preference by default, with a manual toggle in the header. Persist the choice in `localStorage`.
   - Apply the saved theme before first paint, so there's no flash of the wrong theme.
   - Every color comes from CSS custom properties, and both themes meet WCAG AA.
   - Set `color-scheme` so native controls (date picker, select, scrollbars) match the theme.
2. **Undo delete:** deleting a task shows a toast with a "ביטול" (undo) button for 5 seconds. Undo restores the task exactly as it was.
   - Defer the server delete until the 5 seconds pass. If the page is closed during that time, send the pending deletes right away.
   - If the delete fails after the 5 seconds, restore the task and show the Hebrew error toast.
   - `Ctrl/Cmd+Z`, when you're not typing in a field, undoes the most recent pending delete.
3. **Keyboard shortcuts:** `n` focuses the new-task field, `/` focuses search, and `Esc` closes the drawer, dialog or mobile menu. Ignore shortcuts while typing in a field or when Ctrl, Alt or Meta is held. Show a short shortcut hint in the UI.
4. **Mobile:**
   - Below 1024px, the sidebar collapses behind a hamburger button (`aria-expanded`, `aria-controls`) into an off-canvas panel with a backdrop.
   - The panel closes on Esc, on a backdrop click, and on navigation. Focus moves into the panel when it opens and returns to the button when it closes. The page behind it can't be reached while it's open (use `inert`).
   - Use 44px touch targets on mobile. No horizontal scroll at 360px width.
5. **Accessibility pass:**
   - a skip link to the main content
   - visible focus states everywhere
   - an `aria-label` on every icon button
   - sensible heading order and landmarks
   - respect `prefers-reduced-motion`
   - check contrast for text, muted text, overdue red, chips, toasts and the dark theme
6. **Tests:** unit-test the pure parts. That means shortcut matching, theme resolution, and the store's deferred delete (undo, commit after 5 seconds, failure after commit, flush), using fake timers.
7. **Docs:** update the README with the shortcuts, dark mode and undo behavior.

## Acceptance Criteria
- Lighthouse Accessibility ≥ 90 on mobile and desktop.
- Every action is reachable by keyboard only.
- No horizontal scroll at 360px width.
- Undo within 5 seconds restores the task, and nothing is deleted on the server. Without undo, the task is deleted on the server.
- Dark mode follows the system preference, the toggle overrides it and persists across reloads, and there's no flash on load.
- `npm run lint`, `npm test` and `npm run build` pass. No console errors. `ui/` never imports `api/`. Supabase security advisors show no findings.

## Process
Work in Plan mode first: show me the plan and wait for my approval before writing files. Work on a branch `phase-3`, commit in logical steps, push, open a pull request to `main`, and check the Vercel preview (including Lighthouse) before I decide on merging.
