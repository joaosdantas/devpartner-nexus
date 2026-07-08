import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "manager" | "developer" | "client";

export interface SessionContext {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  roles: AppRole[];
  isStaff: boolean;
  clientId: string | null;
  clientName: string | null;
}

/**
 * Returns the authenticated user's profile, roles and (for clients) the
 * associated client workspace. Used to gate /admin/* vs /workspace/* routes
 * and to render the shell header without any mocked data.
 */
export const getSessionContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionContext> => {
    const { supabase, userId, claims } = context;

    const [{ data: profile }, { data: rolesRows }, { data: memberRow }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("client_members")
          .select("client_id, clients(company_name)")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const roles = ((rolesRows ?? []).map((r) => r.role) as AppRole[]).filter(Boolean);
    const isStaff = roles.some((r) => r === "admin" || r === "manager" || r === "developer");

    return {
      userId,
      email: profile?.email ?? (claims?.email as string) ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      roles,
      isStaff,
      clientId: memberRow?.client_id ?? null,
      clientName:
        (memberRow?.clients as { company_name?: string } | null)?.company_name ?? null,
    };
  });
