import { describe, expect, it } from 'vitest';
import { filterAll, filterDone, filterToday } from './views.js';

const today = '2026-10-29';

const t = (id, fields = {}) => ({
  id,
  status: 'todo',
  priority: 'medium',
  due_date: null,
  completed_at: null,
  created_at: '2026-10-01T10:00:00Z',
  ...fields,
});

const ids = (tasks) => tasks.map((task) => task.id);

describe('filterToday', () => {
  const tasks = [
    t('overdue', { due_date: '2026-10-27' }),
    t('today', { due_date: '2026-10-29' }),
    t('tomorrow', { due_date: '2026-10-30' }),
    t('no-date'),
    t('done-today', { due_date: '2026-10-29', status: 'done' }),
    t('done-overdue', { due_date: '2026-10-20', status: 'done' }),
    t('in-progress-today', { due_date: '2026-10-29', status: 'in_progress' }),
  ];

  it('includes open tasks due today or overdue only', () => {
    expect(ids(filterToday(tasks, today)).sort()).toEqual(
      ['in-progress-today', 'overdue', 'today'].sort(),
    );
  });

  it('orders by due date, then high priority first', () => {
    const list = [
      t('today-low', { due_date: today, priority: 'low' }),
      t('today-high', { due_date: today, priority: 'high' }),
      t('overdue', { due_date: '2026-10-28', priority: 'low' }),
    ];
    expect(ids(filterToday(list, today))).toEqual(['overdue', 'today-high', 'today-low']);
  });

  it('does not mutate the input array', () => {
    const list = [t('b', { due_date: today }), t('a', { due_date: '2026-10-01' })];
    filterToday(list, today);
    expect(ids(list)).toEqual(['b', 'a']);
  });
});

describe('filterAll', () => {
  it('lists open tasks by due date (undated last), then done tasks', () => {
    const list = [
      t('done', { status: 'done', completed_at: '2026-10-29T08:00:00Z' }),
      t('undated'),
      t('later', { due_date: '2026-11-05' }),
      t('sooner', { due_date: '2026-10-30' }),
    ];
    expect(ids(filterAll(list))).toEqual(['sooner', 'later', 'undated', 'done']);
  });
});

describe('filterDone', () => {
  it('shows only done tasks, most recently completed first', () => {
    const list = [
      t('old', { status: 'done', completed_at: '2026-10-01T08:00:00Z' }),
      t('open'),
      t('new', { status: 'done', completed_at: '2026-10-29T08:00:00Z' }),
    ];
    expect(ids(filterDone(list))).toEqual(['new', 'old']);
  });
});
