// Pure date helpers. Dates are handled as local-calendar 'YYYY-MM-DD' strings, which
// compare correctly as plain strings and match Postgres `date` values.

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar date of `now` as 'YYYY-MM-DD' (not UTC). */
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Shifts a 'YYYY-MM-DD' date by `days` calendar days. */
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

/** True when the task is not done and its due date is before `today`. */
export function isOverdue(task, today) {
  return task.status !== 'done' && Boolean(task.due_date) && task.due_date < today;
}

const dateFormatter = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' });
const dateWithYearFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Short Hebrew label for a due date: היום / מחר / אתמול, or e.g. "5 בנוב׳". */
export function formatDueDate(iso, today = todayISO()) {
  if (!iso) return '';
  if (iso === today) return 'היום';
  if (iso === addDays(today, 1)) return 'מחר';
  if (iso === addDays(today, -1)) return 'אתמול';

  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return (sameYear ? dateFormatter : dateWithYearFormatter).format(date);
}
