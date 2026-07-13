// Detalhe de demanda (compartilhado admin/workspace via prop `role`).
// Inclui edição rápida de status/prioridade, comentários com realtime e
// timer que persiste sessões em `timer_sessions`.
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Pencil, Play, Square } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { EmptyState } from "@/components/app/empty-state";
import { TaskFormDialog } from "@/components/forms/task-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { SessionContext } from "@/lib/session.functions";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABEL,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_VARIANT,
  formatDurationSeconds,
} from "@/lib/entities";

interface Props {
  taskId: string;
  session: SessionContext;
  role: "admin" | "workspace";
}

export function TaskDetailView({ taskId, session, role }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [comment, setComment] = React.useState("");

  const taskQ = useQuery({
    queryKey: ["tasks", taskId, "detail"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "*, clients(id, company_name), projects(name, color), assignee:profiles!tasks_assignee_id_fkey(full_name, email)",
        )
        .eq("id", taskId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const commentsQ = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, profiles!task_comments_author_id_fkey(full_name, email)")
        .eq("task_id", taskId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  // Realtime: comentários novos aparecem automaticamente.
  React.useEffect(() => {
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["task-comments", taskId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, qc]);

  const commentMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        author_id: session.userId,
        content: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateFieldMut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId, "detail"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Timer: sessão local, persiste em timer_sessions ao parar. Somente staff.
  const [timerStart, setTimerStart] = React.useState<number | null>(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!timerStart) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  const elapsed = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;

  const stopTimer = useMutation({
    mutationFn: async () => {
      if (!timerStart) return;
      const started = new Date(timerStart);
      const ended = new Date();
      const seconds = Math.max(1, Math.floor((ended.getTime() - started.getTime()) / 1000));
      const { error } = await supabase.from("timer_sessions").insert({
        task_id: taskId,
        user_id: session.userId,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        seconds,
      });
      if (error) throw error;
      const current = Number(taskQ.data?.spent_seconds ?? 0);
      await supabase
        .from("tasks")
        .update({ spent_seconds: current + seconds })
        .eq("id", taskId);
    },
    onSuccess: () => {
      setTimerStart(null);
      setTick(0);
      toast.success("Sessão registrada");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const t = taskQ.data;

  return (
    <AppShell
      role={role}
      session={session}
      breadcrumb={[
        {
          label: "Demandas",
          to: role === "admin" ? "/admin/tasks" : "/workspace/tasks",
        },
        { label: t?.title ?? "..." },
      ]}
    >
      {!t ? (
        <div className="py-24 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.clients?.company_name ?? "—"}
                    {t.projects?.name ? ` · ${t.projects.name}` : ""}
                  </p>
                </div>
                {role === "admin" && (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="mr-1.5 size-4" /> Editar
                  </Button>
                )}
              </div>
              {t.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">
                  {t.description}
                </p>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Comentários</h2>
                <span className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {commentsQ.data?.length ?? 0}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {(commentsQ.data ?? []).length === 0 ? (
                  <EmptyState
                    title="Nenhum comentário"
                    description="Seja o primeiro a comentar nesta demanda."
                  />
                ) : (
                  (commentsQ.data ?? []).map((c) => {
                    const author =
                      (c.profiles as { full_name?: string; email?: string } | null)
                        ?.full_name ??
                      (c.profiles as { email?: string } | null)?.email ??
                      "Usuário";
                    return (
                      <div key={c.id} className="flex gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {author.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 rounded-lg border border-border bg-card/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{author}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(c.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => commentMut.mutate()}
                    disabled={!comment.trim() || commentMut.isPending}
                  >
                    {commentMut.isPending ? "Enviando..." : "Comentar"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detalhes
              </h3>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {role === "admin" ? (
                    <Select
                      value={t.status}
                      onValueChange={(v) => updateFieldMut.mutate({ status: v })}
                    >
                      <SelectTrigger className="h-8 w-[170px] text-xs">
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
                  ) : (
                    <StatusBadge
                      status={TASK_STATUS_VARIANT[t.status]}
                      label={TASK_STATUS_LABEL[t.status]}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prioridade</span>
                  {role === "admin" ? (
                    <Select
                      value={t.priority}
                      onValueChange={(v) => updateFieldMut.mutate({ priority: v })}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
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
                  ) : (
                    <PriorityBadge priority={t.priority as never} />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Responsável</span>
                  <span>
                    {(t.assignee as { full_name?: string; email?: string } | null)
                      ?.full_name ??
                      (t.assignee as { email?: string } | null)?.email ??
                      "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span>
                    {t.delivery_date
                      ? new Date(t.delivery_date).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimadas</span>
                  <span>{t.estimated_hours ? `${Number(t.estimated_hours)}h` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Horas gastas</span>
                  <span className="font-mono">
                    {formatDurationSeconds(Number(t.spent_seconds ?? 0))}
                  </span>
                </div>
                {t.clients && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    {role === "admin" ? (
                      <Link
                        to="/admin/clients/$clientId"
                        params={{ clientId: t.clients.id }}
                        className="hover:text-primary"
                      >
                        {t.clients.company_name}
                      </Link>
                    ) : (
                      <span>{t.clients.company_name}</span>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {session.isStaff && (
              <Card className="p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Timer
                </h3>
                <p className="mt-3 font-mono text-3xl font-semibold tabular-nums">
                  {formatDurationSeconds(elapsed || tick)}
                </p>
                <div className="mt-4 flex gap-2">
                  {!timerStart ? (
                    <Button className="flex-1" onClick={() => setTimerStart(Date.now())}>
                      <Play className="mr-1.5 size-4" /> Iniciar
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      variant="danger"
                      onClick={() => stopTimer.mutate()}
                      disabled={stopTimer.isPending}
                    >
                      <Square className="mr-1.5 size-4" /> Parar e registrar
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {role === "admin" && t && (
        <TaskFormDialog
          open={editing}
          onOpenChange={setEditing}
          task={t}
          mode="admin"
        />
      )}
    </AppShell>
  );
}
