import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Demandas", to: "/admin/tasks", icon: ListChecks },
      { label: "Projetos", to: "/admin/projects", icon: FolderKanban },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Clientes", to: "/admin/clients", icon: Users },
      { label: "Calendário", to: "/admin/dashboard", icon: Calendar },
      { label: "Relatórios", to: "/admin/dashboard", icon: BarChart3 },
      { label: "Faturamento", to: "/admin/dashboard", icon: FileText },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Bee Assistant", to: "/admin/dashboard", icon: Sparkles },
      { label: "Mensagens", to: "/admin/dashboard", icon: MessageSquare },
      { label: "Configurações", to: "/admin/settings", icon: Settings },
    ],
  },
];

const WORKSPACE_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", to: "/workspace/dashboard", icon: LayoutDashboard },
      { label: "Demandas", to: "/workspace/tasks", icon: ListChecks },
    ],
  },
  {
    label: "Conta",
    items: [
      { label: "Mensagens", to: "/workspace/dashboard", icon: MessageSquare },
      { label: "Configurações", to: "/workspace/dashboard", icon: Settings },
    ],
  },
];

export function AppSidebar({
  collapsed,
  onToggle,
  role,
}: {
  collapsed: boolean;
  onToggle: () => void;
  role: "admin" | "workspace";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = role === "admin" ? ADMIN_GROUPS : WORKSPACE_GROUPS;

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur transition-[width] duration-300 md:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex h-14 items-center justify-between px-3">
        <Logo collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {groups.map((g, gi) => (
          <div key={gi} className="mt-2">
            {g.label && !collapsed && (
              <p className="px-3 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                {g.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                          transition={{ duration: 0.25 }}
                        />
                      )}
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-full text-muted-foreground"
          aria-label={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </Button>
      </div>
    </aside>
  );
}
