import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        backlog:
          "border-border bg-muted/40 text-muted-foreground",
        todo:
          "border-info/30 bg-info/10 text-info",
        in_progress:
          "border-primary/30 bg-primary/10 text-primary-glow",
        in_review:
          "border-warning/30 bg-warning/10 text-warning",
        blocked:
          "border-destructive/30 bg-destructive/10 text-destructive",
        done:
          "border-success/30 bg-success/10 text-success",
        cancelled:
          "border-border bg-muted/30 text-muted-foreground line-through decoration-muted-foreground/50",
        active:
          "border-success/30 bg-success/10 text-success",
        inactive:
          "border-border bg-muted/40 text-muted-foreground",
        suspended:
          "border-destructive/30 bg-destructive/10 text-destructive",
        draft:
          "border-border bg-muted/40 text-muted-foreground",
        open: "border-info/30 bg-info/10 text-info",
        paid: "border-success/30 bg-success/10 text-success",
        overdue:
          "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { status: "todo" },
  },
);

const LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  in_review: "Em revisão",
  blocked: "Bloqueada",
  done: "Concluída",
  cancelled: "Cancelada",
  active: "Ativo",
  inactive: "Inativo",
  suspended: "Suspenso",
  draft: "Rascunho",
  open: "Aberta",
  paid: "Paga",
  overdue: "Atrasada",
};

export type StatusValue = NonNullable<
  VariantProps<typeof statusBadgeVariants>["status"]
>;

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
  dot?: boolean;
}

export function StatusBadge({
  status = "todo",
  className,
  label,
  dot = true,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {label ?? LABELS[status ?? "todo"] ?? status}
    </span>
  );
}
