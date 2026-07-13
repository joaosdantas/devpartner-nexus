// Shared labels + option lists for domain enums.
// Keeps the UI consistent across admin and workspace surfaces.

import type { Database } from "@/integrations/supabase/types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type ClientStatus = Database["public"]["Enums"]["client_status"];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "new", label: "Nova" },
  { value: "in_analysis", label: "Em análise" },
  { value: "awaiting_approval", label: "Aguardando aprovação" },
  { value: "in_development", label: "Em desenvolvimento" },
  { value: "in_testing", label: "Em testes" },
  { value: "awaiting_client", label: "Aguardando cliente" },
  { value: "paused", label: "Pausada" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planejamento" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
];

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "suspended", label: "Suspenso" },
];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<TaskStatus, string>;

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = Object.fromEntries(
  TASK_PRIORITY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<TaskPriority, string>;

// Map task_status → visual status variant used by StatusBadge (which uses a
// smaller shared vocabulary).
export const TASK_STATUS_VARIANT: Record<
  TaskStatus,
  "backlog" | "todo" | "in_progress" | "in_review" | "blocked" | "done" | "cancelled"
> = {
  new: "todo",
  in_analysis: "backlog",
  awaiting_approval: "in_review",
  in_development: "in_progress",
  in_testing: "in_review",
  awaiting_client: "in_review",
  paused: "blocked",
  completed: "done",
  cancelled: "cancelled",
};

export const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "new", label: "Novas" },
  { status: "in_analysis", label: "Em análise" },
  { status: "in_development", label: "Em desenvolvimento" },
  { status: "in_testing", label: "Em testes" },
  { status: "awaiting_client", label: "Aguardando cliente" },
  { status: "completed", label: "Concluídas" },
];

export function formatDurationSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return "0h";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
