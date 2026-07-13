// Admin → Cliente detalhado (abas: informações, projetos, demandas).
import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, Phone, FileText, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { HoursProgress } from "@/components/app/hours-progress";
import { EmptyState } from "@/components/app/empty-state";
import { ClientFormDialog } from "@/components/forms/client-form";
import { ProjectFormDialog } from "@/components/forms/project-form";
import { TaskFormDialog } from "@/components/forms/task-form";
import { supabase } from "@/integrations/supabase/client";
import {
  TASK_STATUS_LABEL,
  TASK_STATUS_VARIANT,
  formatCurrencyBRL,
} from "@/lib/entities";

export const Route = createFileRoute("/_authenticated/admin/clients/$clientId")({
  head: () => ({
    meta: [{ title: "Cliente · DEV Partner Workspace" }],
  }),
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const session = Route.useRouteContext().session;
  const [editClient, setEditClient] = React.useState(false);
  const [newProject, setNewProject] = React.useState(false);
  const [newTask, setNewTask] = React.useState(false);

  const clientQ = useQuery({
    queryKey: ["clients", clientId, "detail"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, plans(name, monthly_hours)")
        .eq("id", clientId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const projectsQ = useQuery({
    queryKey: ["projects", "byClient", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const tasksQ = useQuery({
    queryKey: ["tasks", "byClient", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const hoursUsed = React.useMemo(() => {
    const total = (tasksQ.data ?? []).reduce(
      (acc, t) => acc + Number(t.spent_seconds ?? 0),
      0,
    );
    return total / 3600;
  }, [tasksQ.data]);

  const client = clientQ.data;

  return (
    <AppShell
      role="admin"
      session={session}
      breadcrumb={[
        { label: "Clientes", href: "/admin/clients" },
        { label: client?.company_name ?? "..." },
      ]}
    >
      {!client ? (
        <div className="py-24 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid size-14 place-items-center rounded-xl border border-border bg-card">
                <Building2 className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {client.company_name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <StatusBadge status={client.status as never} />
                  {client.plans?.name && <span>Plano {client.plans.name}</span>}
                  <span>{Number(client.monthly_hours)}h/mês</span>
                  <span>{formatCurrencyBRL(Number(client.monthly_value))}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setEditClient(true)}>
              <Pencil className="mr-1.5 size-4" /> Editar
            </Button>
          </header>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Consumo de horas do mês</h2>
              <span className="text-xs text-muted-foreground">
                {hoursUsed.toFixed(1)}h / {Number(client.monthly_hours)}h
              </span>
            </div>
            <div className="mt-4">
              <HoursProgress
                used={hoursUsed}
                total={Number(client.monthly_hours) || 1}
              />
            </div>
          </Card>

          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="projects">
                Projetos ({projectsQ.data?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Demandas ({tasksQ.data?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <InfoRow icon={<Mail className="size-4" />} label="E-mail" value={client.email} />
                  <InfoRow icon={<Phone className="size-4" />} label="Telefone" value={client.phone} />
                  <InfoRow label="Contato" value={client.contact_name} />
                  <InfoRow label="CNPJ" value={client.cnpj} />
                </div>
                {client.notes && (
                  <div className="mt-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Observações
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                      {client.notes}
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              <div className="mb-3 flex justify-end">
                <Button onClick={() => setNewProject(true)}>
                  <Plus className="mr-1.5 size-4" /> Novo projeto
                </Button>
              </div>
              {(projectsQ.data ?? []).length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nenhum projeto"
                  description="Crie um projeto para organizar demandas deste cliente."
                  action={{ label: "Criar projeto", onClick: () => setNewProject(true) }}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(projectsQ.data ?? []).map((p) => (
                    <Card key={p.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 size-2.5 shrink-0 rounded-full"
                          style={{ background: p.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {p.description ?? "Sem descrição"}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <StatusBadge status={p.status as never} />
                            {p.deadline && (
                              <span className="text-xs text-muted-foreground">
                                Prazo:{" "}
                                {new Date(p.deadline).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="mb-3 flex justify-end">
                <Button onClick={() => setNewTask(true)}>
                  <Plus className="mr-1.5 size-4" /> Nova demanda
                </Button>
              </div>
              {(tasksQ.data ?? []).length === 0 ? (
                <EmptyState
                  title="Nenhuma demanda"
                  description="Nenhuma demanda cadastrada para este cliente."
                  action={{ label: "Criar demanda", onClick: () => setNewTask(true) }}
                />
              ) : (
                <Card className="divide-y divide-border/60">
                  {(tasksQ.data ?? []).map((t) => (
                    <Link
                      key={t.id}
                      to="/admin/tasks/$taskId"
                      params={{ taskId: t.id }}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {TASK_STATUS_LABEL[t.status]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={t.priority as never} />
                        <StatusBadge status={TASK_STATUS_VARIANT[t.status]} />
                      </div>
                    </Link>
                  ))}
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <ClientFormDialog
        open={editClient}
        onOpenChange={setEditClient}
        client={client ?? null}
      />
      <ProjectFormDialog
        open={newProject}
        onOpenChange={setNewProject}
        defaultClientId={clientId}
      />
      <TaskFormDialog
        open={newTask}
        onOpenChange={setNewTask}
        mode="admin"
        defaultClientId={clientId}
      />
    </AppShell>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}
