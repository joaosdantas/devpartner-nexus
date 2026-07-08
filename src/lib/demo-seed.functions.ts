import { createServerFn } from "@tanstack/react-start";

interface SeedResult {
  ok: boolean;
  message: string;
  admin?: { email: string };
  client?: { email: string };
}

/**
 * Bootstraps the demo environment: creates the two demo users, assigns roles,
 * ensures the "Agência Demo" client exists on the PRO plan, and links the
 * agency user as a client member. Idempotent — safe to call any number of times.
 */
export const seedDemoEnvironment = createServerFn({ method: "POST" }).handler(
  async (): Promise<SeedResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const users: Array<{
      email: string;
      password: string;
      full_name: string;
      role: "admin" | "client";
    }> = [
      {
        email: "admin@devpartner.com",
        password: "Admin@123",
        full_name: "Administrador DevPartner",
        role: "admin",
      },
      {
        email: "agencia@teste.com",
        password: "Agencia@123",
        full_name: "Agência Demo",
        role: "client",
      },
    ];

    const ensuredIds: Record<string, string> = {};

    for (const u of users) {
      // Try to find existing user by listing (Supabase Admin API has no getByEmail).
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
      let user = list.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

      if (!user) {
        const { data: created, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.full_name },
          });
        if (createErr) throw new Error(`createUser ${u.email}: ${createErr.message}`);
        user = created.user!;
      } else {
        // Ensure password matches the documented demo password.
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: { ...(user.user_metadata ?? {}), full_name: u.full_name },
        });
      }

      ensuredIds[u.email] = user.id;

      // Upsert profile (the on-signup trigger may not have fired for pre-existing users).
      await supabaseAdmin.from("profiles").upsert(
        { id: user.id, email: u.email, full_name: u.full_name },
        { onConflict: "id" },
      );

      // Assign role (idempotent via unique constraint).
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: user.id, role: u.role }, { onConflict: "user_id,role" });
    }

    // Ensure the PRO plan exists (seeded by migration, but guard anyway).
    const { data: proPlan } = await supabaseAdmin
      .from("plans")
      .select("id, monthly_hours")
      .eq("tier", "pro")
      .maybeSingle();

    // Ensure "Agência Demo" client exists linked to PRO, with the demo 30h override.
    const AGENCY_HOURS = 30;
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("company_name", "Agência Demo")
      .maybeSingle();

    let clientId = existingClient?.id;
    if (!clientId) {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("clients")
        .insert({
          company_name: "Agência Demo",
          contact_name: "Agência Demo",
          email: "agencia@teste.com",
          plan_id: proPlan?.id ?? null,
          monthly_hours: AGENCY_HOURS,
          status: "active",
        })
        .select("id")
        .single();
      if (insErr) throw new Error(`insert client: ${insErr.message}`);
      clientId = inserted.id;
    } else {
      await supabaseAdmin
        .from("clients")
        .update({
          plan_id: proPlan?.id ?? null,
          monthly_hours: AGENCY_HOURS,
          status: "active",
        })
        .eq("id", clientId);
    }

    // Link the agency user as primary client member.
    const agencyUserId = ensuredIds["agencia@teste.com"];
    await supabaseAdmin
      .from("client_members")
      .upsert(
        { client_id: clientId, user_id: agencyUserId, is_primary: true },
        { onConflict: "client_id,user_id" },
      );

    return {
      ok: true,
      message: "Ambiente demo pronto.",
      admin: { email: "admin@devpartner.com" },
      client: { email: "agencia@teste.com" },
    };
  },
);
