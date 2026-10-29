import { getSupabase } from './client.js';

/** Fetches all tasks, newest first. Throws on failure. */
export async function listTasks() {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
