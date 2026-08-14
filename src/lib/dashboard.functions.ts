import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminDashboardData {
  totals: {
    clients: number;
    projects: number;
    tasks: number;
    activeTasks: number;
    hoursLogged: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    client: string | null;
    updatedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
    actor: string | null;
  }>;
}

export interface WorkspaceDashboardData {
  client: {
    id: string;
    name: string;
    planName: string | null;
    monthlyHours: number;
  } | null;
  hoursUsedThisMonth: number;
  totals: {
    projects: number;
    openTasks: number;
    completedTasks: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    delivery_date: string;
  }>;
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboardData> => {
    const { supabase } = context;

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      clientsRes,
      projectsRes,
      tasksRes,
      activeTasksRes,
      hoursRes,
      recentTasksRes,
      activityRes,
    ] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .not("status", "in", "(completed,cancelled)"),
      supabase
        .from("timer_sessions")
        .select("seconds")
        .gte("started_at", monthStart.toISOString()),
      supabase
        .from("tasks")
        .select("id, title, status, priority, updated_at, clients(company_name)")
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_id, actor_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const hoursLogged =
      (hoursRes.data ?? []).reduce(
        (acc, row) => acc + Number(row.seconds ?? 0),
        0,
      ) / 3600;

    const actorIds = [
      ...new Set(
        (activityRes.data ?? [])
          .map((a) => a.actor_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    let actorNames: Record<string, string> = {};
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);
      actorNames = Object.fromEntries(
        (actors ?? []).map((p) => [p.id, p.full_name ?? ""]),
      );
    }

    return {
      totals: {
        clients: clientsRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        tasks: tasksRes.count ?? 0,
        activeTasks: activeTasksRes.count ?? 0,
        hoursLogged: Math.round(hoursLogged * 100) / 100,
      },
      recentTasks: (recentTasksRes.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        client: (t.clients as { company_name?: string } | null)?.company_name ?? null,
        updatedAt: t.updated_at,
      })),
      recentActivity: (activityRes.data ?? []).map((a) => ({
        id: a.id,
        action: a.action,
        entity_type: a.entity_type,
        entity_id: a.entity_id,
        created_at: a.created_at,
        actor: (a.actor_id && actorNames[a.actor_id]) || null,
      })),
    };
  });

export const getWorkspaceDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkspaceDashboardData> => {
    const { supabase, userId } = context;

    const { data: member } = await supabase
      .from("client_members")
      .select("client_id, clients(id, company_name, monthly_hours, plans(name))")
      .eq("user_id", userId)
      .maybeSingle();

    if (!member?.client_id) {
      return {
        client: null,
        hoursUsedThisMonth: 0,
        totals: { projects: 0, openTasks: 0, completedTasks: 0 },
        recentTasks: [],
        upcomingDeadlines: [],
      };
    }

    const clientRow = member.clients as {
      id: string;
      company_name: string;
      monthly_hours: number;
      plans: { name?: string } | null;
    } | null;

    const clientId = member.client_id;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      projectsRes,
      openTasksRes,
      completedTasksRes,
      hoursRes,
      recentTasksRes,
      deadlinesRes,
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .not("status", "in", "(completed,cancelled)"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("status", "completed"),
      supabase
        .from("timer_sessions")
        .select("seconds, tasks!inner(client_id)")
        .gte("started_at", monthStart.toISOString())
        .eq("tasks.client_id", clientId),
      supabase
        .from("tasks")
        .select("id, title, status, priority, updated_at")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase
        .from("tasks")
        .select("id, title, delivery_date")
        .eq("client_id", clientId)
        .not("delivery_date", "is", null)
        .not("status", "in", "(completed,cancelled)")
        .order("delivery_date", { ascending: true })
        .limit(5),
    ]);

    const hoursUsedThisMonth =
      (hoursRes.data ?? []).reduce(
        (acc, row) => acc + Number(row.seconds ?? 0),
        0,
      ) / 3600;

    return {
      client: clientRow
        ? {
            id: clientRow.id,
            name: clientRow.company_name,
            planName: clientRow.plans?.name ?? null,
            monthlyHours: Number(clientRow.monthly_hours ?? 0),
          }
        : null,
      hoursUsedThisMonth: Math.round(hoursUsedThisMonth * 100) / 100,
      totals: {
        projects: projectsRes.count ?? 0,
        openTasks: openTasksRes.count ?? 0,
        completedTasks: completedTasksRes.count ?? 0,
      },
      recentTasks: (recentTasksRes.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        updatedAt: t.updated_at,
      })),
      upcomingDeadlines: (deadlinesRes.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        delivery_date: t.delivery_date!,
      })),
    };
  });
