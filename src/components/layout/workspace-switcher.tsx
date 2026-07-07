import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Workspace {
  id: string;
  name: string;
  plan: string;
}

const WORKSPACES: Workspace[] = [
  { id: "1", name: "DEV Partner", plan: "Enterprise" },
  { id: "2", name: "Nexabee Cliente", plan: "Pro" },
  { id: "3", name: "Atelier Studio", plan: "Starter" },
];

export function WorkspaceSwitcher() {
  const [current, setCurrent] = React.useState<Workspace>(WORKSPACES[0]);
  const [open, setOpen] = React.useState(false);

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
          {WORKSPACES.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setCurrent(w);
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
        </div>
        <div className="mt-2 border-t border-border pt-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Plus /> Criar workspace
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
