// The only module that imports supabase-js. Uses the public anon/publishable key only —
// never a service_role / secret key.
import { createClient } from '@supabase/supabase-js';

let client = null;

/** Returns the shared Supabase client, creating it on first use. */
export function getSupabase() {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const missing = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and fill in your Supabase project values.',
    );
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
