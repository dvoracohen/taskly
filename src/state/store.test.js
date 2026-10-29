import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/tasks.js', () => ({
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('../api/categories.js', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const task = (id, fields = {}) => ({
  id,
  title: id,
  status: 'todo',
  priority: 'medium',
  due_date: null,
  completed_at: null,
  ...fields,
});

const category = (id, fields = {}) => ({ id, name: id, color: '#6B7280', ...fields });

let api;
let categoriesApi;
let store;
let notices;

beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  api = await import('../api/tasks.js');
  categoriesApi = await import('../api/categories.js');
  store = await import('./store.js');
  vi.mocked(api.listTasks).mockResolvedValue([task('a'), task('b'), task('c')]);
  vi.mocked(categoriesApi.listCategories).mockResolvedValue([]);
  await store.load();
  notices = [];
  store.onNotice((n) => notices.push(n));
});

const titles = () => store.getState().tasks.map((t) => t.id);

describe('store optimistic updates', () => {
  it('rolls back a failed update and emits an error notice', async () => {
    vi.mocked(api.updateTask).mockRejectedValue(new Error('offline'));
    const pending = store.updateTask('b', { status: 'done' });

    expect(store.getTask('b').status).toBe('done');
    expect(store.getTask('b').completed_at).not.toBeNull();

    await pending;
    expect(store.getTask('b')).toEqual(task('b'));
    expect(notices.at(-1).type).toBe('error');
  });

  it('restores a failed delete at its original position', async () => {
    vi.mocked(api.deleteTask).mockRejectedValue(new Error('offline'));
    const pending = store.removeTask('b');
    expect(titles()).toEqual(['a', 'c']);

    await pending;
    expect(titles()).toEqual(['a', 'b', 'c']);
    expect(notices.at(-1).type).toBe('error');
  });

  it('removes the temporary task when create fails', async () => {
    vi.mocked(api.createTask).mockRejectedValue(new Error('offline'));
    const pending = store.addTask('new');
    expect(store.getState().tasks[0]).toMatchObject({ title: 'new', pending: true });

    await pending;
    expect(titles()).toEqual(['a', 'b', 'c']);
    expect(notices.at(-1).type).toBe('error');
  });

  it('swaps the temporary task for the saved row on success', async () => {
    vi.mocked(api.createTask).mockResolvedValue(task('server-id', { title: 'new' }));
    await store.addTask('new');

    expect(store.getState().tasks[0]).toEqual(task('server-id', { title: 'new' }));
    expect(notices.at(-1)).toEqual({ type: 'success', message: 'המשימה נוספה' });
  });

  it('does not let a stale failure overwrite a newer change', async () => {
    let rejectFirst;
    vi.mocked(api.updateTask)
      .mockImplementationOnce(() => new Promise((_, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce(task('b', { title: 'second' }));

    const first = store.updateTask('b', { title: 'first' });
    await store.updateTask('b', { title: 'second' });
    rejectFirst(new Error('offline'));
    await first;

    expect(store.getTask('b').title).toBe('second');
  });
});

describe('store categories', () => {
  beforeEach(async () => {
    vi.mocked(api.listTasks).mockResolvedValue([
      task('w1', { category_id: 'work' }),
      task('w2', { category_id: 'work' }),
      task('h1', { category_id: 'home' }),
      task('none'),
    ]);
    vi.mocked(categoriesApi.listCategories).mockResolvedValue([category('home'), category('work')]);
    await store.load();
  });

  const categoryOf = (id) => store.getTask(id).category_id;
  const categoryIds = () => store.getState().categories.map((c) => c.id);

  it('deleting a category keeps its tasks and makes them uncategorized', async () => {
    vi.mocked(categoriesApi.deleteCategory).mockResolvedValue();
    await store.removeCategory('work');

    expect(categoryIds()).toEqual(['home']);
    expect(store.getState().tasks).toHaveLength(4);
    expect(categoryOf('w1')).toBeNull();
    expect(categoryOf('w2')).toBeNull();
    expect(categoryOf('h1')).toBe('home');
  });

  it('a failed category delete restores the category and its tasks', async () => {
    vi.mocked(categoriesApi.deleteCategory).mockRejectedValue(new Error('offline'));
    const pending = store.removeCategory('work');
    expect(categoryOf('w1')).toBeNull();

    await pending;
    expect(categoryIds()).toEqual(['home', 'work']);
    expect(categoryOf('w1')).toBe('work');
    expect(categoryOf('w2')).toBe('work');
    expect(notices.at(-1).type).toBe('error');
  });

  it('a failed delete does not undo a task edited in the meantime', async () => {
    let rejectDelete;
    vi.mocked(categoriesApi.deleteCategory).mockImplementation(
      () => new Promise((_, reject) => (rejectDelete = reject)),
    );
    vi.mocked(api.updateTask).mockResolvedValue(task('w1', { category_id: 'home' }));

    const pending = store.removeCategory('work');
    await store.updateTask('w1', { category_id: 'home' });
    rejectDelete(new Error('offline'));
    await pending;

    expect(categoryOf('w1')).toBe('home');
    expect(categoryOf('w2')).toBe('work');
  });

  it('shows a Hebrew duplicate-name error and removes the temp category', async () => {
    vi.mocked(categoriesApi.createCategory).mockRejectedValue({ code: '23505' });
    await store.addCategory('work', '#ff0000');

    expect(categoryIds()).toEqual(['home', 'work']);
    expect(notices.at(-1)).toEqual({ type: 'error', message: 'כבר קיימת קטגוריה בשם הזה' });
  });

  it('rolls back a failed rename', async () => {
    vi.mocked(categoriesApi.updateCategory).mockRejectedValue(new Error('offline'));
    const pending = store.updateCategory('work', { name: 'עבודה' });
    expect(store.getCategory('work').name).toBe('עבודה');

    await pending;
    expect(store.getCategory('work').name).toBe('work');
  });
});
