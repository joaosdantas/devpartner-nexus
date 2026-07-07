import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CrumbItem {
  label: string;
  to?: string;
}

export function AppBreadcrumb({
  items,
  className,
}: {
  items: CrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}
    >
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
            {it.to && !last ? (
              <Link
                to={it.to}
                className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
              >
                {it.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "rounded px-1 py-0.5",
                  last && "font-medium text-foreground",
                )}
                aria-current={last ? "page" : undefined}
              >
                {it.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
