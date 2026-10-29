import { describe, expect, it } from 'vitest';
import { addDays, formatDueDate, isOverdue, todayISO } from './dates.js';

describe('todayISO', () => {
  it('uses the local calendar date, zero-padded', () => {
    expect(todayISO(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('stays on the same day at 23:59 and rolls over at 00:01', () => {
    expect(todayISO(new Date(2026, 9, 29, 23, 59))).toBe('2026-10-29');
    expect(todayISO(new Date(2026, 9, 30, 0, 1))).toBe('2026-10-30');
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
});

describe('isOverdue', () => {
  const today = '2026-10-29';
  const task = (due_date, status = 'todo') => ({ due_date, status });

  it('is true for an open task due yesterday', () => {
    expect(isOverdue(task('2026-10-28'), today)).toBe(true);
  });

  it('is false for tasks due today or tomorrow', () => {
    expect(isOverdue(task('2026-10-29'), today)).toBe(false);
    expect(isOverdue(task('2026-10-30'), today)).toBe(false);
  });

  it('is false without a due date', () => {
    expect(isOverdue(task(null), today)).toBe(false);
  });

  it('is false for done tasks, even when the date has passed', () => {
    expect(isOverdue(task('2026-10-01', 'done'), today)).toBe(false);
  });

  it('counts in_progress tasks as open', () => {
    expect(isOverdue(task('2026-10-28', 'in_progress'), today)).toBe(true);
  });
});

describe('formatDueDate', () => {
  const today = '2026-10-29';

  it('uses relative Hebrew words for nearby dates', () => {
    expect(formatDueDate('2026-10-29', today)).toBe('היום');
    expect(formatDueDate('2026-10-30', today)).toBe('מחר');
    expect(formatDueDate('2026-10-28', today)).toBe('אתמול');
  });

  it('returns an empty string without a date', () => {
    expect(formatDueDate(null, today)).toBe('');
  });
});
