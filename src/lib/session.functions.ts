import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedClient } from "@/integrations/supabase/auth-middleware";

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

export const getSessionContext = createServerFn({ method: "GET" })
  .validator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }): Promise<SessionContext> => {
    const { supabase, userId } = await createAuthenticatedClient(data.accessToken);

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
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      roles,
      isStaff,
      clientId: memberRow?.client_id ?? null,
      clientName:
        (memberRow?.clients as { company_name?: string } | null)?.company_name ?? null,
    };
  });
