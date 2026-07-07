import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  accent?: "primary" | "success" | "warning" | "info";
  className?: string;
  index?: number;
}

const accentMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "from-primary/25 to-primary/0 text-primary-glow",
  success: "from-success/25 to-success/0 text-success",
  warning: "from-warning/25 to-warning/0 text-warning",
  info: "from-info/25 to-info/0 text-info",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "primary",
  className,
  index = 0,
}: KpiCardProps) {
  const positive = trend ? trend.value >= 0 : true;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-border/70 bg-card/60 p-5 backdrop-blur transition-colors hover:border-border-strong",
          className,
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl",
            accentMap[accent],
          )}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          {Icon && (
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border/70 bg-background/40 text-muted-foreground">
              <Icon className="size-5" />
            </div>
          )}
        </div>
        {trend && (
          <div className="relative mt-4 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                positive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
            {trend.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
