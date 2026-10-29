// In-memory task store with pub/sub. The UI reads and mutates tasks only through here.
// Every mutation is optimistic: the store changes first, then the API call runs; on failure
// that one item is rolled back and an error notice is emitted.
import * as api from '../api/tasks.js';

let state = { tasks: [], loading: true, loadError: false };
const listeners = new Set();
const noticeListeners = new Set();

function setState(patch) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

function notice(type, message) {
  for (const fn of noticeListeners) fn({ type, message });
}

function setTasks(tasks) {
  setState({ tasks });
}

const findIndex = (id) => state.tasks.findIndex((t) => t.id === id);

// Replaces `expected` with `next` only if it is still the current object for that id,
// so a late response never overwrites a newer local change.
function replaceIfCurrent(expected, next) {
  const i = state.tasks.indexOf(expected);
  if (i === -1) return;
  const tasks = state.tasks.slice();
  tasks[i] = next;
  setTasks(tasks);
}

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

/** Loads all tasks from the server. */
export async function load() {
  setState({ loading: true, loadError: false });
  try {
    const tasks = await api.listTasks();
    setState({ tasks, loading: false });
  } catch (err) {
    console.error('Failed to load tasks:', err);
    setState({ loading: false, loadError: true });
  }
}

/** Adds a task optimistically. `fields` may include e.g. due_date. */
export async function addTask(title, fields = {}) {
  const now = new Date().toISOString();
  const temp = {
    id: `temp-${crypto.randomUUID()}`,
    title,
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    ...fields,
    pending: true,
  };
  setTasks([temp, ...state.tasks]);

  try {
    const saved = await api.createTask({ title, ...fields });
    replaceIfCurrent(temp, saved);
    notice('success', 'המשימה נוספה');
  } catch (err) {
    console.error('Failed to create task:', err);
    setTasks(state.tasks.filter((t) => t !== temp));
    notice('error', 'לא הצלחנו להוסיף את המשימה. נסו שוב.');
  }
}

/**
 * Updates a task optimistically.
 * @param {{ silent?: boolean }} options  silent: no success toast (e.g. checkbox toggles)
 */
export async function updateTask(id, patch, { silent = false } = {}) {
  const i = findIndex(id);
  if (i === -1) return;
  const previous = state.tasks[i];
  if (previous.pending) return;

  const optimistic = { ...previous, ...patch };
  // Mirror the set_completed_at trigger so the Done view is right before the server answers.
  if ('status' in patch && patch.status !== previous.status) {
    optimistic.completed_at = patch.status === 'done' ? new Date().toISOString() : null;
  }
  const tasks = state.tasks.slice();
  tasks[i] = optimistic;
  setTasks(tasks);

  try {
    const saved = await api.updateTask(id, patch);
    replaceIfCurrent(optimistic, saved);
    if (!silent) notice('success', 'המשימה עודכנה');
  } catch (err) {
    console.error('Failed to update task:', err);
    replaceIfCurrent(optimistic, previous);
    notice('error', 'לא הצלחנו לשמור את השינוי. נסו שוב.');
  }
}

/** Deletes a task optimistically; on failure it is restored at its old position. */
export async function removeTask(id) {
  const i = findIndex(id);
  if (i === -1) return;
  const removed = state.tasks[i];
  if (removed.pending) return;
  setTasks(state.tasks.filter((t) => t !== removed));

  try {
    await api.deleteTask(id);
    notice('success', 'המשימה נמחקה');
  } catch (err) {
    console.error('Failed to delete task:', err);
    const tasks = state.tasks.slice();
    tasks.splice(Math.min(i, tasks.length), 0, removed);
    setTasks(tasks);
    notice('error', 'לא הצלחנו למחוק את המשימה. נסו שוב.');
  }
}
