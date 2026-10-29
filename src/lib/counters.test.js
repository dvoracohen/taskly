import { describe, expect, it } from 'vitest';
import { countCompletedToday, countOpen, countOverdue, openByCategory } from './counters.js';

const today = '2026-10-29';
const localISO = (y, m, d, h, min) => new Date(y, m - 1, d, h, min).toISOString();

const tasks = [
  { status: 'todo', due_date: '2026-10-28', category_id: 'a' },
  { status: 'in_progress', due_date: '2026-10-29', category_id: 'a' },
  { status: 'todo', due_date: null, category_id: null },
  {
    status: 'done',
    due_date: '2026-10-01',
    category_id: 'a',
    completed_at: localISO(2026, 10, 29, 0, 5),
  },
  {
    status: 'done',
    due_date: null,
    category_id: 'b',
    completed_at: localISO(2026, 10, 28, 23, 59),
  },
];

describe('counters', () => {
  it('counts open tasks (todo + in_progress)', () => {
    expect(countOpen(tasks)).toBe(3);
  });

  it('counts overdue open tasks only', () => {
    expect(countOverdue(tasks, today)).toBe(1);
  });

  it('counts tasks completed today by local date (23:59 yesterday excluded)', () => {
    expect(countCompletedToday(tasks, today)).toBe(1);
  });

  it('groups open tasks by category, uncategorized under null', () => {
    const counts = openByCategory(tasks);
    expect(counts.get('a')).toBe(2);
    expect(counts.get(null)).toBe(1);
    expect(counts.has('b')).toBe(false);
  });
});
