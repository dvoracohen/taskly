// Pure view logic: which tasks each view shows, and in what order.

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// Tasks without a due date sort after dated ones.
function compareDueDate(a, b) {
  if (a.due_date === b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return a.due_date < b.due_date ? -1 : 1;
}

const comparePriority = (a, b) =>
  (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);

// Newest first; ISO timestamps compare correctly as strings.
const compareDesc = (key) => (a, b) => (b[key] ?? '').localeCompare(a[key] ?? '');

const byDueThenPriority = (a, b) => compareDueDate(a, b) || comparePriority(a, b);
const byDueThenCreated = (a, b) => compareDueDate(a, b) || compareDesc('created_at')(a, b);

/** Not done, due today or earlier (overdue included). */
export function filterToday(tasks, today) {
  return tasks
    .filter((t) => t.status !== 'done' && t.due_date && t.due_date <= today)
    .sort(byDueThenPriority);
}

/** Every task: open ones by due date first, then done ones (most recently completed first). */
export function filterAll(tasks) {
  const open = tasks.filter((t) => t.status !== 'done').sort(byDueThenCreated);
  const done = tasks.filter((t) => t.status === 'done').sort(compareDesc('completed_at'));
  return [...open, ...done];
}

/** Done tasks, most recently completed first. */
export function filterDone(tasks) {
  return tasks.filter((t) => t.status === 'done').sort(compareDesc('completed_at'));
}

export const VIEWS = {
  today: { title: 'היום', filter: filterToday },
  all: { title: 'הכל', filter: filterAll },
  done: { title: 'הושלמו', filter: filterDone },
};
