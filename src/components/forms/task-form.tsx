// Task/demand form used by both admin and client-workspace surfaces.
// Behaviour differs by `mode`:
//  - "admin"     → full control (client, project, category, assignee, status)
//  - "workspace" → client member creating a task in their own workspace
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/entities";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskRow | null;
  mode: "admin" | "workspace";
  workspaceClientId?: string | null;
  defaultClientId?: string | null;
  defaultProjectId?: string | null;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  mode,
  workspaceClientId,
  defaultClientId,
  defaultProjectId,
}: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(task);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "select"],
    enabled: mode === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = React.useState({
    client_id: "",
    project_id: "",
    category_id: "",
    assignee_id: "",
    title: "",
    description: "",
    priority: "normal" as Database["public"]["Enums"]["task_priority"],
    status: "new" as Database["public"]["Enums"]["task_status"],
    delivery_date: "",
    estimated_hours: "",
  });

  React.useEffect(() => {
    if (!open) return;
    const initClient =
      task?.client_id ??
      defaultClientId ??
      (mode === "workspace" ? workspaceClientId ?? "" : "");
    setForm({
      client_id: initClient ?? "",
      project_id: task?.project_id ?? defaultProjectId ?? "",
      category_id: task?.category_id ?? "",
      assignee_id: task?.assignee_id ?? "",
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "normal",
      status: task?.status ?? "new",
      delivery_date: task?.delivery_date
        ? new Date(task.delivery_date).toISOString().slice(0, 10)
        : "",
      estimated_hours:
        task?.estimated_hours != null ? String(task.estimated_hours) : "",
    });
  }, [open, task, defaultClientId, defaultProjectId, workspaceClientId, mode]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "byClient", form.client_id],
    enabled: Boolean(form.client_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("client_id", form.client_id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", "list"],
    enabled: mode === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "manager", "developer"]);
      if (error) throw error;
      const seen = new Set<string>();
      const userIds = (data ?? [])
        .filter((r) => {
          if (seen.has(r.user_id)) return false;
          seen.add(r.user_id);
          return true;
        })
        .map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return userIds.map((id) => ({
        id,
        name: byId.get(id)?.full_name ?? byId.get(id)?.email ?? "Usuário",
      }));
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sessão inválida");

      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        client_id: form.client_id,
        project_id: form.project_id || null,
        category_id: form.category_id || null,
        priority: form.priority,
        status: mode === "workspace" && !isEdit ? "new" : form.status,
        assignee_id: mode === "admin" ? form.assignee_id || null : task?.assignee_id ?? null,
        delivery_date: form.delivery_date
          ? new Date(form.delivery_date).toISOString()
          : null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      };

      if (isEdit && task) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert({ ...payload, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Demanda atualizada" : "Demanda criada");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["workspace", "dashboard"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar demanda" : "Nova demanda"}</DialogTitle>
          <DialogDescription>
            {mode === "workspace"
              ? "Descreva o que você precisa. Nosso time recebe a demanda automaticamente."
              : "Cadastre uma demanda vinculada a um cliente e projeto."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim()) return toast.error("Informe o título");
            if (!form.client_id) return toast.error("Selecione o cliente");
            mutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Detalhe o que precisa ser feito, links, prints..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mode === "admin" && (
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, client_id: v, project_id: "" }))
                  }
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Projeto</Label>
              <Select
                value={form.project_id || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, project_id: v === "none" ? "" : v }))
                }
                disabled={!form.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem projeto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={form.category_id || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category_id: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, priority: v as typeof f.priority }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "admin" && (
              <>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as typeof f.status }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Select
                    value={form.assignee_id || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, assignee_id: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não atribuído" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="delivery_date">Data de entrega</Label>
              <Input
                id="delivery_date"
                type="date"
                value={form.delivery_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, delivery_date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="estimated_hours">Horas estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                min={0}
                step={0.25}
                value={form.estimated_hours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimated_hours: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar demanda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
