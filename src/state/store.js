// In-memory store for tasks and categories, with pub/sub. The UI reads and mutates data only
// through here. Every mutation is optimistic: the store changes first, then the API call runs;
// on failure only the affected items are rolled back and an error notice is emitted.
import * as categoriesApi from '../api/categories.js';
import * as api from '../api/tasks.js';

let state = { tasks: [], categories: [], loading: true, loadError: false };
const listeners = new Set();
const noticeListeners = new Set();

function setState(patch) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

function notice(type, message) {
  for (const fn of noticeListeners) fn({ type, message });
}

const tempId = () => `temp-${crypto.randomUUID()}`;

// Replaces `expected` in state[key] with `next` only if it is still the current object,
// so a late response never overwrites a newer local change.
function replaceIfCurrent(key, expected, next) {
  const i = state[key].indexOf(expected);
  if (i === -1) return;
  const items = state[key].slice();
  items[i] = next;
  setState({ [key]: items });
}

// Postgres unique_violation, e.g. a duplicate category name.
const isDuplicate = (err) => err?.code === '23505';

/** Subscribes to state changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribes to success / error notices (for toasts). Returns an unsubscribe function. */
export function onNotice(fn) {
  noticeListeners.add(fn);
  return () => noticeListeners.delete(fn);
}

export function getState() {
  return state;
}

export function getTask(id) {
  return state.tasks.find((t) => t.id === id);
}

export function getCategory(id) {
  return state.categories.find((c) => c.id === id);
}

/** Loads tasks and categories from the server. */
export async function load() {
  setState({ loading: true, loadError: false });
  try {
    const [tasks, categories] = await Promise.all([
      api.listTasks(),
      categoriesApi.listCategories(),
    ]);
    setState({ tasks, categories, loading: false });
  } catch (err) {
    console.error('Failed to load data:', err);
    setState({ loading: false, loadError: true });
  }
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/** Adds a task optimistically. `fields` may include e.g. due_date or category_id. */
export async function addTask(title, fields = {}) {
  const now = new Date().toISOString();
  const temp = {
    id: tempId(),
    title,
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    category_id: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    ...fields,
    pending: true,
  };
  setState({ tasks: [temp, ...state.tasks] });

  try {
    const saved = await api.createTask({ title, ...fields });
    replaceIfCurrent('tasks', temp, saved);
    notice('success', 'המשימה נוספה');
  } catch (err) {
    console.error('Failed to create task:', err);
    setState({ tasks: state.tasks.filter((t) => t !== temp) });
    notice('error', 'לא הצלחנו להוסיף את המשימה. נסו שוב.');
  }
}

/**
 * Updates a task optimistically.
 * @param {{ silent?: boolean }} options  silent: no success toast (e.g. checkbox toggles)
 */
export async function updateTask(id, patch, { silent = false } = {}) {
  const previous = getTask(id);
  if (!previous || previous.pending) return;

  const optimistic = { ...previous, ...patch };
  // Mirror the set_completed_at trigger so the Done view is right before the server answers.
  if ('status' in patch && patch.status !== previous.status) {
    optimistic.completed_at = patch.status === 'done' ? new Date().toISOString() : null;
  }
  replaceIfCurrent('tasks', previous, optimistic);

  try {
    const saved = await api.updateTask(id, patch);
    replaceIfCurrent('tasks', optimistic, saved);
    if (!silent) notice('success', 'המשימה עודכנה');
  } catch (err) {
    console.error('Failed to update task:', err);
    replaceIfCurrent('tasks', optimistic, previous);
    notice('error', 'לא הצלחנו לשמור את השינוי. נסו שוב.');
  }
}

/** Deletes a task optimistically; on failure it is restored at its old position. */
export async function removeTask(id) {
  const i = state.tasks.findIndex((t) => t.id === id);
  if (i === -1) return;
  const removed = state.tasks[i];
  if (removed.pending) return;
  setState({ tasks: state.tasks.filter((t) => t !== removed) });

  try {
    await api.deleteTask(id);
    notice('success', 'המשימה נמחקה');
  } catch (err) {
    console.error('Failed to delete task:', err);
    const tasks = state.tasks.slice();
    tasks.splice(Math.min(i, tasks.length), 0, removed);
    setState({ tasks });
    notice('error', 'לא הצלחנו למחוק את המשימה. נסו שוב.');
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const byName = (a, b) => a.name.localeCompare(b.name, 'he');

/** Adds a category optimistically. */
export async function addCategory(name, color) {
  const temp = {
    id: tempId(),
    name,
    color,
    created_at: new Date().toISOString(),
    pending: true,
  };
  setState({ categories: [...state.categories, temp].sort(byName) });

  try {
    const saved = await categoriesApi.createCategory({ name, color });
    replaceIfCurrent('categories', temp, saved);
    notice('success', 'הקטגוריה נוספה');
  } catch (err) {
    console.error('Failed to create category:', err);
    setState({ categories: state.categories.filter((c) => c !== temp) });
    notice(
      'error',
      isDuplicate(err) ? 'כבר קיימת קטגוריה בשם הזה' : 'לא הצלחנו להוסיף את הקטגוריה. נסו שוב.',
    );
  }
}

/** Renames / recolors a category optimistically. */
export async function updateCategory(id, patch) {
  const previous = getCategory(id);
  if (!previous || previous.pending) return;

  const optimistic = { ...previous, ...patch };
  replaceIfCurrent('categories', previous, optimistic);

  try {
    const saved = await categoriesApi.updateCategory(id, patch);
    replaceIfCurrent('categories', optimistic, saved);
    notice('success', 'הקטגוריה עודכנה');
  } catch (err) {
    console.error('Failed to update category:', err);
    replaceIfCurrent('categories', optimistic, previous);
    notice(
      'error',
      isDuplicate(err) ? 'כבר קיימת קטגוריה בשם הזה' : 'לא הצלחנו לשמור את הקטגוריה. נסו שוב.',
    );
  }
}

/**
 * Deletes a category optimistically. Mirrors the database's `on delete set null`: its tasks
 * stay and become uncategorized. On failure the category and those tasks are restored.
 */
export async function removeCategory(id) {
  const i = state.categories.findIndex((c) => c.id === id);
  if (i === -1) return;
  const removed = state.categories[i];
  if (removed.pending) return;

  // nulled task object -> original task object, for rollback
  const originals = new Map();
  const tasks = state.tasks.map((t) => {
    if (t.category_id !== id) return t;
    const nulled = { ...t, category_id: null };
    originals.set(nulled, t);
    return nulled;
  });
  setState({ categories: state.categories.filter((c) => c !== removed), tasks });

  try {
    await categoriesApi.deleteCategory(id);
    notice('success', 'הקטגוריה נמחקה');
  } catch (err) {
    console.error('Failed to delete category:', err);
    const categories = state.categories.slice();
    categories.splice(Math.min(i, categories.length), 0, removed);
    // Restore only tasks that were not changed again in the meantime.
    setState({
      categories,
      tasks: state.tasks.map((t) => originals.get(t) ?? t),
    });
    notice('error', 'לא הצלחנו למחוק את הקטגוריה. נסו שוב.');
  }
}
