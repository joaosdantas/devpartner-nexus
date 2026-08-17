import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the current Supabase access token from the client session.
 * Throws if no session exists.
 */
export async function getAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error("No active session. Please log in again.");
  }
  return session.access_token;
}
