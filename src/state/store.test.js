import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/tasks.js', () => ({
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
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

let api;
let store;
let notices;

beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  api = await import('../api/tasks.js');
  store = await import('./store.js');
  vi.mocked(api.listTasks).mockResolvedValue([task('a'), task('b'), task('c')]);
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
