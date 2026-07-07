import * as React from "react";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: Date;
  read?: boolean;
  color?: "primary" | "success" | "warning" | "info";
}

const SEED: Notification[] = [
  {
    id: "1",
    title: "Nova demanda criada",
    description: "Ajustes na landing page — Nexabee",
    time: new Date(Date.now() - 5 * 60 * 1000),
    color: "primary",
  },
  {
    id: "2",
    title: "Comentário em DEM-021",
    description: "Ana adicionou uma observação sobre o Kanban.",
    time: new Date(Date.now() - 42 * 60 * 1000),
    color: "info",
  },
  {
    id: "3",
    title: "Cliente aprovou entrega",
    description: "Sprint 08 marcada como concluída.",
    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: true,
    color: "success",
  },
];

const DOT: Record<NonNullable<Notification["color"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
};

export function NotificationsMenu() {
  const [items, setItems] = React.useState(SEED);
  const unread = items.filter((i) => !i.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">
              {unread} não lidas
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() =>
              setItems((prev) => prev.map((n) => ({ ...n, read: true })))
            }
          >
            <Check /> Marcar todas
          </Button>
        </div>
        <ScrollArea className="max-h-[420px]">
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                  !n.read && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    DOT[n.color ?? "primary"],
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {n.description}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {formatDistanceToNow(n.time, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="border-t border-border px-4 py-2 text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
