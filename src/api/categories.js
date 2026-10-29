import { getSupabase } from './client.js';

const COLUMNS = 'id, name, color, created_at';

/** Fetches all categories, by name. Throws on failure. */
export async function listCategories() {
  const { data, error } = await getSupabase().from('categories').select(COLUMNS).order('name');
  if (error) throw error;
  return data;
}

/** Inserts a category and returns the saved row. */
export async function createCategory(fields) {
  const { data, error } = await getSupabase()
    .from('categories')
    .insert(fields)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

/** Applies `patch` to the category with `id` and returns the saved row. */
export async function updateCategory(id, patch) {
  const { data, error } = await getSupabase()
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

/** Deletes the category; the database sets category_id = null on its tasks. */
export async function deleteCategory(id) {
  const { error } = await getSupabase().from('categories').delete().eq('id', id);
  if (error) throw error;
}
