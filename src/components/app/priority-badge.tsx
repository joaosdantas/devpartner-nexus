import * as React from "react";
import { ArrowDown, ArrowUp, Equal, Flame } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const priorityBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      priority: {
        low: "border-border bg-muted/40 text-muted-foreground",
        normal: "border-info/30 bg-info/10 text-info",
        high: "border-warning/30 bg-warning/10 text-warning",
        urgent: "border-destructive/40 bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: { priority: "normal" },
  },
);

export type PriorityValue = NonNullable<
  VariantProps<typeof priorityBadgeVariants>["priority"]
>;

const LABELS: Record<PriorityValue, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const ICONS: Record<PriorityValue, React.ReactNode> = {
  low: <ArrowDown className="size-3" />,
  normal: <Equal className="size-3" />,
  high: <ArrowUp className="size-3" />,
  urgent: <Flame className="size-3" />,
};

export interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof priorityBadgeVariants> {}

export function PriorityBadge({
  priority = "normal",
  className,
  ...props
}: PriorityBadgeProps) {
  const p = (priority ?? "normal") as PriorityValue;
  return (
    <span
      className={cn(priorityBadgeVariants({ priority: p }), className)}
      {...props}
    >
      {ICONS[p]}
      {LABELS[p]}
    </span>
  );
}
