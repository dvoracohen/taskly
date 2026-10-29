import { getSupabase } from './client.js';

const COLUMNS =
  'id, title, description, status, priority, due_date, category_id, completed_at, created_at, updated_at';

/** Fetches all tasks, newest first. Throws on failure. */
export async function listTasks() {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select(COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Inserts a task and returns the saved row. */
export async function createTask(fields) {
  const { data, error } = await getSupabase().from('tasks').insert(fields).select(COLUMNS).single();

  if (error) throw error;
  return data;
}

/** Applies `patch` to the task with `id` and returns the saved row. */
export async function updateTask(id, patch) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

/** Deletes the task with `id`. */
export async function deleteTask(id) {
  const { error } = await getSupabase().from('tasks').delete().eq('id', id);
  if (error) throw error;
}
