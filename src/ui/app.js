// App shell: skip link, header (menu, counters, theme), sidebar, toolbar, quick add, list,
// drawer, dialogs, toasts and keyboard shortcuts.
// Talks to state only — never to api/.
import { openByCategory } from '../lib/counters.js';
import { todayISO } from '../lib/dates.js';
import { applyQuery } from '../lib/query.js';
import { VIEWS } from '../lib/views.js';
import * as store from '../state/store.js';
import { createCategoryDialog } from './categoryDialog.js';
import { createCounters } from './counters.js';
import { el } from './dom.js';
import { createDrawer } from './drawer.js';
import { createMobileNav } from './mobileNav.js';
import { createQuickAdd } from './quickAdd.js';
import { DEFAULT_HASH, startRouter } from './router.js';
import { installShortcuts, shortcutHint } from './shortcuts.js';
import { createSidebar } from './sidebar.js';
import { renderTaskList } from './taskList.js';
import { createThemeToggle } from './theme.js';
import { createToasts } from './toast.js';
import { createToolbar } from './toolbar.js';

export function initApp(root) {
  let route = null;
  // View settings, kept while the app is open (not data, so not in the store).
  let query = { search: '', sort: 'default' };

  const toasts = createToasts();
  store.onNotice(toasts.show);

  const quickAdd = createQuickAdd({ onAdd: (title) => store.addTask(title, newTaskFields()) });

  // Tasks added from a view should stay visible in that view.
  function newTaskFields() {
    if (route.view === 'today') return { due_date: todayISO() };
    if (route.view === 'category' && route.categoryId) return { category_id: route.categoryId };
    return {};
  }

  const counters = createCounters();
  const toolbar = createToolbar({
    onChange: (next) => {
      query = next;
      render();
    },
  });
  const viewTitle = el('h2', { class: 'view-title', id: 'view-title' });
  const listArea = el('section', { class: 'list-area', 'aria-labelledby': 'view-title' });

  const drawer = createDrawer({
    onSave: (id, patch) => store.updateTask(id, patch),
    onDelete: (id) => store.removeTask(id),
    onClose: (id) => {
      // Return focus to the task's row; if it left this view, fall back to quick add.
      const row = id && listArea.querySelector(`[data-focus-key="open-${id}"]`);
      if (row) row.focus();
      else quickAdd.focus();
    },
  });

  const categoryDialog = createCategoryDialog({
    getCategories: () => store.getState().categories,
    onCreate: (name, color) => store.addCategory(name, color),
    onUpdate: (id, patch) => store.updateCategory(id, patch),
    onDelete: (id) => {
      // Leaving the deleted category's own view: its tasks are now in "ללא קטגוריה" / All.
      // Set the route now: hashchange fires later, and the render triggered by the delete
      // would otherwise treat the category as unknown and redirect to Today.
      if (route.view === 'category' && route.categoryId === id) {
        route = { view: 'all' };
        location.hash = '#/all';
      }
      store.removeCategory(id);
    },
  });

  const sidebar = createSidebar({
    onNewCategory: () => categoryDialog.open(),
    onEditCategory: (id) => {
      const category = store.getCategory(id);
      if (category && !category.pending) categoryDialog.open(category);
    },
  });

  const handlers = {
    onToggle: (task) =>
      store.updateTask(
        task.id,
        { status: task.status === 'done' ? 'todo' : 'done' },
        { silent: true },
      ),
    onOpen: (id) => {
      const task = store.getTask(id);
      if (task && !task.pending) drawer.open(task, store.getState().categories);
    },
    onRetry: () => store.load(),
    onFocusAdd: () => quickAdd.focus(),
    onClearSearch: () => toolbar.clearSearch(),
  };

  const main = el(
    'main',
    { class: 'main', id: 'main', tabindex: '-1' },
    viewTitle,
    toolbar.element,
    quickAdd.element,
    listArea,
    shortcutHint(),
  );
  const header = el('header', { class: 'app-header' });
  const mobileNav = createMobileNav({ sidebar: sidebar.element, background: [header, main] });
  header.append(
    mobileNav.button,
    el('h1', { class: 'app-title', text: 'Taskly' }),
    counters.element,
    createThemeToggle().element,
  );

  root.replaceChildren(
    el('a', { class: 'skip-link', href: '#main', text: 'דלג לתוכן', onClick: skipToMain }),
    header,
    el('div', { class: 'layout' }, sidebar.element, main),
    mobileNav.backdrop,
  );
  document.body.append(drawer.element, categoryDialog.element, toasts.element);

  // The skip link must not change the hash (that is the router's), so move focus directly.
  function skipToMain(event) {
    event.preventDefault();
    main.focus();
  }

  installShortcuts({
    new: () => {
      if (route.view === 'done') location.hash = '#/all';
      quickAdd.focus();
    },
    search: () => toolbar.focusSearch(),
    undo: () => store.undoLastDelete(),
  });

  // Closing or leaving the page: send deletes still waiting out their undo window.
  window.addEventListener('pagehide', () => store.flushPendingDeletes());

  function viewName(categories) {
    if (route.view !== 'category') return VIEWS[route.view].title;
    if (route.categoryId === null) return 'ללא קטגוריה';
    return categories.find((c) => c.id === route.categoryId)?.name ?? '';
  }

  function render() {
    if (!route) return;
    const { tasks, categories, loading, loadError } = store.getState();
    const today = todayISO();

    // Unknown category id (e.g. deleted, or a stale bookmark): back to the default view.
    if (
      route.view === 'category' &&
      route.categoryId &&
      !loading &&
      !loadError &&
      !categories.some((c) => c.id === route.categoryId)
    ) {
      location.replace(DEFAULT_HASH);
      return;
    }

    // Re-rendering replaces rows and links; keep keyboard focus on the same control.
    const focusKey = document.activeElement?.dataset?.focusKey;

    counters.update(tasks, today);
    sidebar.update({ route, categories, openCounts: openByCategory(tasks) });
    viewTitle.textContent = viewName(categories);
    quickAdd.element.hidden = route.view === 'done';

    listArea.replaceChildren(
      renderTaskList(
        {
          route,
          tasks: applyQuery(tasks, { route, today, ...query }),
          loading,
          loadError,
          today,
          search: query.search,
          categoriesById: new Map(categories.map((c) => [c.id, c])),
        },
        handlers,
      ),
    );

    if (focusKey) root.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  store.subscribe(render);
  startRouter((next) => {
    route = next;
    render();
  });
  store.load();
}
