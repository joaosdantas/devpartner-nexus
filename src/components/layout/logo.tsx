import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <motion.div
        initial={{ rotate: -12, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid size-8 shrink-0 place-items-center rounded-lg [background-image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
      >
        <Sparkles className="size-4 text-primary-foreground" />
      </motion.div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            DEV Partner
          </span>
          <span className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </span>
        </div>
      )}
    </div>
  );
}
