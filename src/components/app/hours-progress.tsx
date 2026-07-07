import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HoursProgressProps {
  used: number;
  total: number;
  label?: string;
  className?: string;
  showValues?: boolean;
}

export function HoursProgress({
  used,
  total,
  label = "Horas utilizadas",
  className,
  showValues = true,
}: HoursProgressProps) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const remaining = Math.max(0, total - used);
  const state: "safe" | "warn" | "danger" =
    pct >= 90 ? "danger" : pct >= 70 ? "warn" : "safe";

  const bar =
    state === "danger"
      ? "from-destructive to-destructive/60"
      : state === "warn"
        ? "from-warning to-warning/60"
        : "from-primary to-primary-glow";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {showValues && (
          <p className="text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{used.toFixed(1)}h</span>
            <span className="mx-1 opacity-60">/</span>
            {total.toFixed(0)}h
          </p>
        )}
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-[0_0_20px_-2px_currentColor]",
            bar,
          )}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{pct.toFixed(0)}% consumido</span>
        <span className="tabular-nums">{remaining.toFixed(1)}h restantes</span>
      </div>
    </div>
  );
}
