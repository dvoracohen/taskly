// Pure search + sort, combined with the view filter into one pipeline.
import { compareDesc, compareDueDate, comparePriority, filterForRoute } from './views.js';

const byCreated = compareDesc('created_at');

const SORTERS = {
  due: (a, b) => compareDueDate(a, b) || comparePriority(a, b) || byCreated(a, b),
  priority: (a, b) => comparePriority(a, b) || compareDueDate(a, b) || byCreated(a, b),
  created: byCreated,
};

export const SORT_OPTIONS = [
  ['default', 'ברירת מחדל'],
  ['due', 'תאריך יעד'],
  ['priority', 'עדיפות'],
  ['created', 'תאריך יצירה'],
];

/** Returns a sorted copy. 'default' keeps the incoming (view) order. */
export function sortTasks(tasks, key = 'default') {
  const sorter = SORTERS[key];
  return sorter ? tasks.slice().sort(sorter) : tasks.slice();
}

const normalize = (text) => (text ?? '').toLocaleLowerCase();

/** Case-insensitive substring match on title and description; a blank query matches all. */
export function matchesSearch(task, query) {
  const q = normalize(query).trim();
  if (!q) return true;
  return normalize(task.title).includes(q) || normalize(task.description).includes(q);
}

/** View filter → search → sort. */
export function applyQuery(tasks, { route, today, search = '', sort = 'default' }) {
  const viewed = filterForRoute(tasks, route, today);
  const q = search.trim();
  const found = q ? viewed.filter((t) => matchesSearch(t, q)) : viewed;
  return sortTasks(found, sort);
}
