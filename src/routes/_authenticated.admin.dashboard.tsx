import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Clock, FolderKanban, ListChecks, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/app/kpi-card";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { getAdminDashboard } from "@/lib/dashboard.functions";
import { getAccessToken } from "@/lib/auth-token";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const dashboardQuery = queryOptions({
  queryKey: ["admin", "dashboard"],
  queryFn: async () => {
    const accessToken = await getAccessToken();
    return getAdminDashboard({ data: { accessToken } });
  },
});

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · DEV Partner Workspace" },
      { name: "description", content: "Visão geral de clientes, projetos e horas." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const session = Route.useRouteContext().session;

  return (
    <AppShell
      role="admin"
      session={session}
      breadcrumb={[{ label: "Dashboard" }]}
    >
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {session.fullName ?? "Administrador"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada da operação DEV Partner.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Clientes" value={data.totals.clients} icon={Users} />
          <KpiCard label="Projetos" value={data.totals.projects} icon={FolderKanban} />
          <KpiCard label="Demandas" value={data.totals.tasks} icon={ListChecks} />
          <KpiCard label="Ativas" value={data.totals.activeTasks} icon={Activity} />
          <KpiCard
            label="Horas no mês"
            value={data.totals.hoursLogged.toFixed(1)}
            icon={Clock}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Demandas recentes</h2>
            </div>
            <div className="mt-4 divide-y divide-border/60">
              {data.recentTasks.length === 0 ? (
                <EmptyState
                  title="Sem demandas ainda"
                  description="Assim que clientes abrirem chamados, eles aparecerão aqui."
                />
              ) : (
                data.recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.client ?? "Sem cliente"} ·{" "}
                        {formatDistanceToNow(new Date(t.updatedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={t.priority as never} />
                      <StatusBadge status={t.status as never} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Atividade recente</h2>
            <ul className="mt-4 space-y-3">
              {data.recentActivity.length === 0 ? (
                <EmptyState title="Sem atividade" description="As ações do time aparecerão aqui." />
              ) : (
                data.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 text-sm">
                      <p className="text-foreground">
                        <span className="font-medium">{a.actor ?? "Sistema"}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>{" "}
                        <span className="text-muted-foreground">{a.entity_type}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
