// Workspace → Demandas do cliente. Lista todas as demandas do workspace do usuário e permite abrir novas.
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { EmptyState } from "@/components/app/empty-state";
import { TaskFormDialog } from "@/components/forms/task-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TASK_STATUS_LABEL, TASK_STATUS_VARIANT } from "@/lib/entities";

export const Route = createFileRoute("/_authenticated/workspace/tasks")({
  head: () => ({ meta: [{ title: "Minhas demandas · DEV Partner" }] }),
  component: WorkspaceTasksPage,
});

function WorkspaceTasksPage() {
  const session = Route.useRouteContext().session;
  const [open, setOpen] = React.useState(false);

  const { data = [] } = useQuery({
    queryKey: ["tasks", "workspace", session.clientId],
    enabled: !!session.clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .eq("client_id", session.clientId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      role="workspace"
      session={session}
      breadcrumb={[{ label: session.clientName ?? "Workspace" }, { label: "Demandas" }]}
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Minhas demandas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.length} {data.length === 1 ? "demanda" : "demandas"}
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Nova demanda
          </Button>
        </header>

        <Card className="p-0">
          {data.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ListChecks}
                title="Você ainda não abriu demandas"
                description="Descreva o que precisa ser feito e nosso time recebe automaticamente."
                action={{ label: "Nova demanda", onClick: () => setOpen(true) }}
              />
            </div>
          ) : (
            <DataTable
              data={data}
              searchable
              searchPlaceholder="Buscar demanda..."
              columns={[
                {
                  key: "title",
                  header: "Demanda",
                  cell: (row) => (
                    <Link
                      to="/workspace/tasks/$taskId"
                      params={{ taskId: row.id }}
                      className="font-medium hover:text-primary"
                    >
                      {row.title}
                    </Link>
                  ),
                },
                {
                  key: "project",
                  header: "Projeto",
                  cell: (row) =>
                    (row.projects as { name?: string } | null)?.name ?? "—",
                },
                {
                  key: "priority",
                  header: "Prioridade",
                  cell: (row) => <PriorityBadge priority={row.priority as never} />,
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row) => (
                    <StatusBadge
                      status={TASK_STATUS_VARIANT[row.status]}
                      label={TASK_STATUS_LABEL[row.status]}
                    />
                  ),
                },
                {
                  key: "delivery_date",
                  header: "Entrega",
                  cell: (row) =>
                    row.delivery_date
                      ? new Date(row.delivery_date).toLocaleDateString("pt-BR")
                      : "—",
                },
              ]}
            />
          )}
        </Card>
      </div>

      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="workspace"
        workspaceClientId={session.clientId}
      />
    </AppShell>
  );
}
