import { describe, expect, it } from 'vitest';
import { applyQuery, matchesSearch, sortTasks } from './query.js';

const today = '2026-10-29';

const t = (id, fields = {}) => ({
  id,
  title: id,
  description: null,
  status: 'todo',
  priority: 'medium',
  due_date: null,
  category_id: null,
  completed_at: null,
  created_at: '2026-10-01T10:00:00Z',
  ...fields,
});

const ids = (tasks) => tasks.map((task) => task.id);

describe('sortTasks', () => {
  const list = [
    t('low-soon', { priority: 'low', due_date: '2026-10-30', created_at: '2026-10-03T00:00:00Z' }),
    t('high-late', {
      priority: 'high',
      due_date: '2026-11-10',
      created_at: '2026-10-01T00:00:00Z',
    }),
    t('med-none', { priority: 'medium', created_at: '2026-10-05T00:00:00Z' }),
  ];

  it('default keeps the incoming order', () => {
    expect(ids(sortTasks(list, 'default'))).toEqual(['low-soon', 'high-late', 'med-none']);
  });

  it('due: earliest first, undated last', () => {
    expect(ids(sortTasks(list, 'due'))).toEqual(['low-soon', 'high-late', 'med-none']);
  });

  it('priority: high to low', () => {
    expect(ids(sortTasks(list, 'priority'))).toEqual(['high-late', 'med-none', 'low-soon']);
  });

  it('created: newest first', () => {
    expect(ids(sortTasks(list, 'created'))).toEqual(['med-none', 'low-soon', 'high-late']);
  });

  it('does not mutate the input', () => {
    sortTasks(list, 'priority');
    expect(ids(list)).toEqual(['low-soon', 'high-late', 'med-none']);
  });
});

describe('matchesSearch', () => {
  const task = t('x', { title: 'Buy Milk', description: 'מהמכולת ליד הבית' });

  it('matches title case-insensitively and ignores surrounding spaces', () => {
    expect(matchesSearch(task, '  milk ')).toBe(true);
    expect(matchesSearch(task, 'BUY')).toBe(true);
  });

  it('matches the description, including Hebrew', () => {
    expect(matchesSearch(task, 'מכולת')).toBe(true);
  });

  it('a blank query matches everything; a miss does not match', () => {
    expect(matchesSearch(task, '   ')).toBe(true);
    expect(matchesSearch(task, 'bread')).toBe(false);
  });

  it('copes with a null description', () => {
    expect(matchesSearch(t('y', { title: 'abc' }), 'zzz')).toBe(false);
  });
});

describe('applyQuery (view → search → sort)', () => {
  const tasks = [
    t('work-report', {
      title: 'דוח עבודה',
      category_id: 'work',
      due_date: '2026-10-29',
      priority: 'low',
    }),
    t('work-mail', {
      title: 'מייל לעבודה',
      category_id: 'work',
      due_date: '2026-10-28',
      priority: 'high',
    }),
    t('work-done', {
      title: 'עבודה ישנה',
      category_id: 'work',
      status: 'done',
      completed_at: '2026-10-20T10:00:00Z',
    }),
    t('home', { title: 'כביסה', category_id: 'home', due_date: '2026-10-29' }),
    t('loose', { title: 'עבודה בלי קטגוריה' }),
  ];

  it('category view + search + priority sort combine', () => {
    const result = applyQuery(tasks, {
      route: { view: 'category', categoryId: 'work' },
      today,
      search: 'עבוד',
      sort: 'priority',
    });
    expect(ids(result)).toEqual(['work-mail', 'work-done', 'work-report']);
  });

  it('today view excludes undated and done tasks before searching', () => {
    // 'work-done' (done) and 'loose' (no due date) match the text but are not in Today;
    // 'home' is in Today but does not match the text.
    const result = applyQuery(tasks, { route: { view: 'today' }, today, search: 'עבוד' });
    expect(ids(result)).toEqual(['work-mail', 'work-report']);
  });

  it('uncategorized view (categoryId null)', () => {
    const result = applyQuery(tasks, { route: { view: 'category', categoryId: null }, today });
    expect(ids(result)).toEqual(['loose']);
  });

  it('empty search returns the whole view', () => {
    const result = applyQuery(tasks, { route: { view: 'all' }, today, search: '' });
    expect(result).toHaveLength(5);
  });
});

describe('search performance', () => {
  it('filters 500 tasks well under 300ms', () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      t(`t${i}`, {
        title: `משימה מספר ${i} עם כותרת ארוכה למדי`,
        description: i % 7 === 0 ? 'פרטים נוספים על חלב ולחם' : 'תיאור כללי של המשימה',
        due_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
      }),
    );
    const start = performance.now();
    const result = applyQuery(many, { route: { view: 'all' }, today, search: 'חלב', sort: 'due' });
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(Math.ceil(500 / 7));
    expect(elapsed).toBeLessThan(50);
  });
});
