import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface Workspace {
  id: string;
  name: string;
  plan: string;
}

interface WorkspaceSwitcherProps {
  userId?: string;
  isStaff?: boolean;
  currentClientId?: string;
  onSelect?: (workspace: Workspace) => void;
}

export function WorkspaceSwitcher({
  userId,
  isStaff = false,
  currentClientId,
  onSelect,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = React.useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces", userId, isStaff],
    queryFn: async () => {
      if (isStaff) {
        const { data, error } = await supabase
          .from("clients")
          .select("id, company_name, plans(name)")
          .order("company_name");
        if (error) throw error;
        return (data ?? []).map((c) => ({
          id: c.id,
          name: c.company_name,
          plan: (c as { plans?: { name?: string } | null }).plans?.name ?? "—",
        }));
      }
      if (!userId) return [];
      const { data: memberships, error } = await supabase
        .from("client_members")
        .select("client_id, clients(id, company_name, plans(name))")
        .eq("user_id", userId);
      if (error) throw error;
      return (memberships ?? []).map((m) => {
        const client = (m as { clients?: { id: string; company_name: string; plans?: { name?: string } | null } | null }).clients;
        return {
          id: m.client_id,
          name: client?.company_name ?? "—",
          plan: client?.plans?.name ?? "—",
        };
      });
    },
    enabled: !!userId,
  });

  const current = workspaces.find((w) => w.id === currentClientId) ?? workspaces[0];

  if (!current) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 rounded-lg border border-border/70 bg-background/40 px-2.5 hover:bg-accent"
        >
          <span
            className="grid size-6 place-items-center rounded-md text-[11px] font-bold text-primary-foreground [background-image:var(--gradient-primary)]"
            aria-hidden
          >
            {current.name[0]}
          </span>
          <div className="flex min-w-0 flex-col items-start leading-tight">
            <span className="max-w-[140px] truncate text-sm font-medium">
              {current.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {current.plan}
            </span>
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspaces
        </p>
        <div className="space-y-0.5">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                onSelect?.(w);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                current.id === w.id && "bg-accent",
              )}
            >
              <span className="grid size-6 place-items-center rounded-md bg-muted text-[11px] font-bold">
                {w.name[0]}
              </span>
              <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                <span className="truncate">{w.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {w.plan}
                </span>
              </div>
              {current.id === w.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
          {workspaces.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              Nenhum workspace encontrado
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
