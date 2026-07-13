// Admin → Projetos: lista global de projetos com filtros por cliente.
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { ProjectFormDialog } from "@/components/forms/project-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"] & {
  clients: { company_name: string } | null;
};

export const Route = createFileRoute("/_authenticated/admin/projects")({
  head: () => ({
    meta: [
      { title: "Projetos · DEV Partner Workspace" },
      { name: "description", content: "Gestão de projetos por cliente." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const session = Route.useRouteContext().session;
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState<ProjectRow | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<ProjectRow | null>(null);
  const [clientFilter, setClientFilter] = React.useState<string>("all");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data = [] } = useQuery({
    queryKey: ["projects", "list", clientFilter],
    queryFn: async () => {
      let q = supabase
        .from("projects")
        .select("*, clients(company_name)")
        .order("created_at", { ascending: false });
      if (clientFilter !== "all") q = q.eq("client_id", clientFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProjectRow[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Projeto removido");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppShell
      role="admin"
      session={session}
      breadcrumb={[{ label: "Gestão" }, { label: "Projetos" }]}
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.length} {data.length === 1 ? "projeto" : "projetos"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" /> Novo projeto
            </Button>
          </div>
        </header>

        <Card className="p-0">
          {data.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FolderKanban}
                title="Nenhum projeto"
                description="Crie um projeto para começar a organizar demandas."
                action={{
                  label: "Novo projeto",
                  onClick: () => {
                    setEditing(null);
                    setDialogOpen(true);
                  },
                }}
              />
            </div>
          ) : (
            <DataTable
              data={data}
              searchable
              searchPlaceholder="Buscar projeto..."
              columns={[
                {
                  key: "name",
                  header: "Projeto",
                  cell: (row) => (
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: row.color }}
                      />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  ),
                },
                {
                  key: "client",
                  header: "Cliente",
                  cell: (row) => (
                    <Link
                      to="/admin/clients/$clientId"
                      params={{ clientId: row.client_id }}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {row.clients?.company_name ?? "—"}
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row) => <StatusBadge status={row.status as never} />,
                },
                {
                  key: "deadline",
                  header: "Prazo",
                  cell: (row) =>
                    row.deadline
                      ? new Date(row.deadline).toLocaleDateString("pt-BR")
                      : "—",
                },
                {
                  key: "tags",
                  header: "Tags",
                  cell: (row) =>
                    row.tags?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {row.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (row) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(row);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmDelete(row)}
                        >
                          <Trash2 className="mr-2 size-4" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
            />
          )}
        </Card>
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Remover projeto?"
        description={`"${confirmDelete?.name}" e todas as demandas vinculadas serão afetadas.`}
        destructive
        confirmLabel="Remover"
        onConfirm={async () => {
          if (confirmDelete) await deleteMut.mutateAsync(confirmDelete.id);
        }}
      />
    </AppShell>
  );
}
