// App shell: header, view nav, quick add, list, drawer and toasts.
// Talks to state only — never to api/.
import { todayISO } from '../lib/dates.js';
import { VIEWS } from '../lib/views.js';
import * as store from '../state/store.js';
import { el } from './dom.js';
import { createDrawer } from './drawer.js';
import { createQuickAdd } from './quickAdd.js';
import { startRouter } from './router.js';
import { renderTaskList } from './taskList.js';
import { createToasts } from './toast.js';

export function initApp(root) {
  let view = null;

  const toasts = createToasts();
  store.onNotice(toasts.show);

  const quickAdd = createQuickAdd({
    // Tasks added from Today are due today, so they stay in the view they were added to.
    onAdd: (title) => store.addTask(title, view === 'today' ? { due_date: todayISO() } : {}),
  });

  const navLinks = Object.entries(VIEWS).map(([key, { title }]) =>
    el('a', { class: 'views__link', href: `#/${key}`, text: title, dataset: { view: key } }),
  );
  const nav = el('nav', { class: 'views', 'aria-label': 'תצוגות' }, navLinks);
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

  const handlers = {
    onToggle: (task) =>
      store.updateTask(
        task.id,
        { status: task.status === 'done' ? 'todo' : 'done' },
        { silent: true },
      ),
    onOpen: (id) => {
      const task = store.getTask(id);
      if (task && !task.pending) drawer.open(task);
    },
    onRetry: () => store.load(),
    onFocusAdd: () => quickAdd.focus(),
  };

  root.replaceChildren(
    el('header', { class: 'app-header' }, el('h1', { class: 'app-title', text: 'Taskly' })),
    nav,
    quickAdd.element,
    viewTitle,
    listArea,
  );
  document.body.append(drawer.element, toasts.element);

  function render() {
    if (!view) return;
    const { tasks, loading, loadError } = store.getState();
    const today = todayISO();

    for (const link of navLinks) {
      if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    viewTitle.textContent = VIEWS[view].title;
    quickAdd.element.hidden = view === 'done';

    // Re-rendering replaces the rows; keep keyboard focus on the same control if it survives.
    const focusKey = document.activeElement?.dataset?.focusKey;
    listArea.replaceChildren(
      renderTaskList(
        { view, tasks: VIEWS[view].filter(tasks, today), loading, loadError, today },
        handlers,
      ),
    );
    if (focusKey) listArea.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  }

  store.subscribe(render);
  startRouter((next) => {
    view = next;
    render();
  });
  store.load();
}
