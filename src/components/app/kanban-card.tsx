import * as React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusValue } from "./status-badge";
import { PriorityBadge, type PriorityValue } from "./priority-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface KanbanCardData {
  id: string;
  title: string;
  code?: string;
  status?: StatusValue;
  priority?: PriorityValue;
  comments?: number;
  attachments?: number;
  assignee?: { name: string; avatarUrl?: string | null };
  due?: string;
  tags?: { label: string; color?: string }[];
}

export interface KanbanCardProps {
  task: KanbanCardData;
  onClick?: (id: string) => void;
  className?: string;
  index?: number;
}

export function KanbanCard({ task, onClick, className, index = 0 }: KanbanCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(task.id)}
      className={cn(
        "group w-full rounded-xl border border-border bg-card p-3.5 text-left shadow-[var(--shadow-card)] transition-colors hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {task.code && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {task.code}
          </span>
        )}
        {task.priority && <PriorityBadge priority={task.priority} />}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
        {task.title}
      </p>
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span
              key={t.label}
              className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.status && <StatusBadge status={task.status} />}
        </div>
        <div className="flex items-center gap-2.5">
          {task.comments != null && task.comments > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" /> {task.comments}
            </span>
          )}
          {task.attachments != null && task.attachments > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3" /> {task.attachments}
            </span>
          )}
          {task.assignee && (
            <Avatar className="size-6 border border-border">
              <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {task.assignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </motion.button>
  );
}
