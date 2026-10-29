// Pure counters for the header and sidebar.
import { isOverdue, todayISO } from './dates.js';

export const countOpen = (tasks) => tasks.filter((t) => t.status !== 'done').length;

export const countOverdue = (tasks, today) => tasks.filter((t) => isOverdue(t, today)).length;

/** Done tasks whose completed_at falls on `today` in the local timezone. */
export const countCompletedToday = (tasks, today) =>
  tasks.filter(
    (t) => t.status === 'done' && t.completed_at && todayISO(new Date(t.completed_at)) === today,
  ).length;

/** Open-task counts per category id; uncategorized tasks are counted under null. */
export function openByCategory(tasks) {
  const counts = new Map();
  for (const t of tasks) {
    if (t.status === 'done') continue;
    const key = t.category_id ?? null;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
