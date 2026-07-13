// Admin → Clientes: lista, criação, edição e remoção.
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { ClientFormDialog } from "@/components/forms/client-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrencyBRL } from "@/lib/entities";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"] & {
  plans: { name: string } | null;
};

export const Route = createFileRoute("/_authenticated/admin/clients")({
  head: () => ({
    meta: [
      { title: "Clientes · DEV Partner Workspace" },
      { name: "description", content: "Gestão de clientes, planos e horas contratadas." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const session = Route.useRouteContext().session;
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState<ClientRow | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<ClientRow | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["clients", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, plans(name)")
        .order("company_name");
      if (error) throw error;
      return data as ClientRow[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppShell
      role="admin"
      session={session}
      breadcrumb={[{ label: "Gestão" }, { label: "Clientes" }]}
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.length} {data.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Novo cliente
          </Button>
        </header>

        <Card className="p-0">
          {!isLoading && data.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Building2}
                title="Nenhum cliente cadastrado"
                description="Comece cadastrando seu primeiro cliente para vincular projetos e demandas."
                action={
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-1.5 size-4" />
                    Novo cliente
                  </Button>
                }
              />
            </div>
          ) : (
            <DataTable
              data={data}
              searchable
              searchPlaceholder="Buscar por empresa, contato..."
              searchKeys={["company_name", "contact_name", "email"]}
              columns={[
                {
                  key: "company_name",
                  header: "Empresa",
                  sortable: true,
                  cell: (row) => (
                    <Link
                      to="/admin/clients/$clientId"
                      params={{ clientId: row.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {row.company_name}
                    </Link>
                  ),
                },
                {
                  key: "contact_name",
                  header: "Contato",
                  cell: (row) => (
                    <div className="text-sm">
                      <p>{row.contact_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.email ?? ""}</p>
                    </div>
                  ),
                },
                {
                  key: "plan",
                  header: "Plano",
                  cell: (row) => row.plans?.name ?? "—",
                },
                {
                  key: "monthly_hours",
                  header: "Horas/mês",
                  align: "right",
                  cell: (row) => `${Number(row.monthly_hours)}h`,
                },
                {
                  key: "monthly_value",
                  header: "Mensalidade",
                  align: "right",
                  cell: (row) => formatCurrencyBRL(Number(row.monthly_value)),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row) => <StatusBadge status={row.status as never} />,
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

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Remover cliente?"
        description={`"${confirmDelete?.company_name}" e todos os projetos, demandas e histórico associados serão removidos.`}
        destructive
        confirmLabel="Remover"
        onConfirm={async () => {
          if (confirmDelete) await deleteMut.mutateAsync(confirmDelete.id);
        }}
      />
    </AppShell>
  );
}
