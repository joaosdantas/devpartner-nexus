// Admin → Demandas: DataTable com filtros + Kanban por status (com drag-and-drop).
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LayoutGrid, ListChecks, List as ListIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { TaskFormDialog } from "@/components/forms/task-form";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import {
  KANBAN_COLUMNS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABEL,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_VARIANT,
  formatDurationSeconds,
} from "@/lib/entities";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients: { company_name: string } | null;
  projects: { name: string; color: string } | null;
};

function SortableKanbanCard({
  task,
  onStatusChange,
}: {
  task: TaskRow;
  onStatusChange: (id: string, status: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab p-3 active:cursor-grabbing">
        <Link
          to="/admin/tasks/$taskId"
          params={{ taskId: task.id }}
          className="block text-sm font-medium hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          {task.clients?.company_name ?? "—"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <PriorityBadge priority={task.priority as never} />
          <StatusBadge
            status={TASK_STATUS_VARIANT[task.status]}
            label={TASK_STATUS_LABEL[task.status]}
          />
        </div>
      </Card>
    </div>
  );
}

function KanbanBoard({
  tasks,
  onStatusChange,
}: {
  tasks: TaskRow[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const activeTask = tasks.find((t) => t.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Determine target column from the droppable container
    const overData = over.data.current;
    let targetStatus: string;

    if (overData?.status) {
      // Dropped on a column container
      targetStatus = overData.status;
    } else {
      // Dropped on another card — find its status
      const overTask = tasks.find((t) => t.id === over.id);
      targetStatus = overTask?.status ?? activeTask.status;
    }

    if (targetStatus !== activeTask.status) {
      onStatusChange(activeTask.id, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.status);
          return (
            <KanbanColumn key={col.status} status={col.status} label={col.label} count={items.length}>
              <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[200px] space-y-2 rounded-xl border border-dashed border-border/60 bg-card/30 p-2">
                  {items.map((t) => (
                    <SortableKanbanCard key={t.id} task={t} onStatusChange={onStatusChange} />
                  ))}
                  {items.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      Vazio
                    </p>
                  )}
                </div>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card className="p-3 shadow-lg">
            <p className="text-sm font-medium">{activeTask.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTask.clients?.company_name ?? "—"}
            </p>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  label,
  count,
  children,
}: {
  status: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useSortable({ id: `column-${status}`, data: { status } });

  return (
    <div className="w-[300px] shrink-0">
      <div className="flex items-center justify-between px-2 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {count}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/30",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/tasks")({
  head: () => ({
    meta: [
      { title: "Demandas · DEV Partner Workspace" },
      { name: "description", content: "Todas as demandas, com filtros e Kanban." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const session = Route.useRouteContext().session;
  const qc = useQueryClient();
  const [view, setView] = React.useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<TaskRow | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
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
    queryKey: ["tasks", "list", { statusFilter, priorityFilter, clientFilter }],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select("*, clients(company_name), projects(name, color)")
        .order("updated_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as never);
      if (priorityFilter !== "all") q = q.eq("priority", priorityFilter as never);
      if (clientFilter !== "all") q = q.eq("client_id", clientFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as TaskRow[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demanda removida");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: status as never })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppShell
      role="admin"
      session={session}
      breadcrumb={[{ label: "Demandas" }]}
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Demandas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.length} {data.length === 1 ? "demanda" : "demandas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as never)}>
              <TabsList>
                <TabsTrigger value="list">
                  <ListIcon className="mr-1.5 size-4" /> Lista
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="mr-1.5 size-4" /> Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" /> Nova demanda
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Cliente" />
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {TASK_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {TASK_PRIORITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view === "list" ? (
          <Card className="p-0">
            {data.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={ListChecks}
                  title="Nenhuma demanda"
                  description="Crie a primeira demanda ou ajuste os filtros."
                  action={{
                    label: "Nova demanda",
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
                searchPlaceholder="Buscar demanda..."
                pageSize={15}
                columns={[
                  {
                    key: "title",
                    header: "Demanda",
                    cell: (row) => (
                      <Link
                        to="/admin/tasks/$taskId"
                        params={{ taskId: row.id }}
                        className="font-medium hover:text-primary"
                      >
                        {row.title}
                      </Link>
                    ),
                  },
                  {
                    key: "client",
                    header: "Cliente / Projeto",
                    cell: (row) => (
                      <div className="text-sm">
                        <p>{row.clients?.company_name ?? "—"}</p>
                        {row.projects?.name && (
                          <p className="text-xs text-muted-foreground">
                            {row.projects.name}
                          </p>
                        )}
                      </div>
                    ),
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
                    key: "spent",
                    header: "Horas",
                    align: "right",
                    cell: (row) => formatDurationSeconds(Number(row.spent_seconds ?? 0)),
                  },
                  {
                    key: "deadline",
                    header: "Entrega",
                    cell: (row) =>
                      row.delivery_date
                        ? new Date(row.delivery_date).toLocaleDateString("pt-BR")
                        : "—",
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
        ) : (
          <KanbanBoard tasks={data} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        mode="admin"
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Remover demanda?"
        description={`A demanda "${confirmDelete?.title}" será removida permanentemente.`}
        destructive
        confirmLabel="Remover"
        onConfirm={async () => {
          if (confirmDelete) await deleteMut.mutateAsync(confirmDelete.id);
        }}
      />
    </AppShell>
  );
}
