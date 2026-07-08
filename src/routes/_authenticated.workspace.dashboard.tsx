import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Clock, FolderKanban, ListChecks, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/app/kpi-card";
import { HoursProgress } from "@/components/app/hours-progress";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { getWorkspaceDashboard } from "@/lib/dashboard.functions";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const dashboardQuery = queryOptions({
  queryKey: ["workspace", "dashboard"],
  queryFn: () => getWorkspaceDashboard(),
});

export const Route = createFileRoute("/_authenticated/workspace/dashboard")({
  head: () => ({
    meta: [
      { title: "Meu Workspace · DEV Partner" },
      { name: "description", content: "Painel do cliente com horas, demandas e prazos." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: WorkspaceDashboardPage,
});

function WorkspaceDashboardPage() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const session = Route.useRouteContext().session;

  const contracted = data.client?.monthlyHours ?? 0;
  const used = data.hoursUsedThisMonth;
  const remaining = Math.max(0, contracted - used);

  return (
    <AppShell
      role="workspace"
      session={session}
      breadcrumb={[{ label: data.client?.name ?? "Workspace" }, { label: "Dashboard" }]}
    >
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.client?.name ?? "Meu Workspace"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plano <strong className="text-foreground">{data.client?.planName ?? "—"}</strong>{" "}
            · {contracted}h contratadas por mês.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Horas contratadas" value={`${contracted}h`} icon={Clock} />
          <KpiCard label="Horas utilizadas" value={`${used.toFixed(1)}h`} icon={Clock} />
          <KpiCard label="Horas restantes" value={`${remaining.toFixed(1)}h`} icon={Clock} />
          <KpiCard label="Projetos" value={data.totals.projects} icon={FolderKanban} />
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Consumo mensal de horas</h2>
            <span className="text-xs text-muted-foreground">
              {used.toFixed(1)}h / {contracted}h
            </span>
          </div>
          <div className="mt-4">
            <HoursProgress used={used} total={contracted || 1} />
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold">Demandas recentes</h2>
            <div className="mt-4 divide-y divide-border/60">
              {data.recentTasks.length === 0 ? (
                <EmptyState
                  title="Sem demandas"
                  description="Abra sua primeira demanda para começar."
                  icon={ListChecks}
                />
              ) : (
                data.recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
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
            <h2 className="text-sm font-semibold">Próximos prazos</h2>
            <ul className="mt-4 space-y-3">
              {data.upcomingDeadlines.length === 0 ? (
                <EmptyState
                  title="Nenhum prazo"
                  description="Demandas com data de entrega aparecerão aqui."
                  icon={CheckCircle2}
                />
              ) : (
                data.upcomingDeadlines.map((t) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 text-sm">
                      <p className="truncate text-foreground">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.delivery_date), "dd 'de' MMMM", { locale: ptBR })}
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
