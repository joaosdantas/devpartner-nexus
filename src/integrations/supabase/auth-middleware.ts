import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates a Supabase client authenticated with the user's access token.
 * Use this in server functions instead of middleware.
 */
export async function createAuthenticatedClient(accessToken: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables.');
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error('Unauthorized: Invalid or expired token');
  }

  return { supabase, userId: data.user.id };
}
