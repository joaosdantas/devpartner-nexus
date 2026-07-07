import * as React from "react";
import { Pause, Play, Square } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimerProps {
  taskLabel?: string;
  initialSeconds?: number;
  running?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onStop?: (seconds: number) => void;
  className?: string;
  compact?: boolean;
}

function fmt(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Timer({
  taskLabel,
  initialSeconds = 0,
  running: runningProp,
  onStart,
  onPause,
  onStop,
  className,
  compact = false,
}: TimerProps) {
  const [seconds, setSeconds] = React.useState(initialSeconds);
  const [running, setRunning] = React.useState(!!runningProp);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      onPause?.();
    } else {
      setRunning(true);
      onStart?.();
    }
  };
  const stop = () => {
    setRunning(false);
    onStop?.(seconds);
    setSeconds(0);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card/60 backdrop-blur",
        compact ? "px-3 py-1.5" : "px-4 py-3",
        className,
      )}
    >
      <motion.span
        animate={running ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className={cn(
          "size-2 rounded-full",
          running ? "bg-success shadow-[0_0_10px] shadow-success" : "bg-muted-foreground/50",
        )}
      />
      <div className="min-w-0 flex-1">
        {taskLabel && !compact && (
          <p className="truncate text-xs text-muted-foreground">{taskLabel}</p>
        )}
        <p className={cn("font-mono tabular-nums text-foreground", compact ? "text-sm" : "text-lg font-semibold")}>
          {fmt(seconds)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size={compact ? "sm" : "icon"}
          variant={running ? "secondary" : "primary"}
          onClick={toggle}
          aria-label={running ? "Pausar" : "Iniciar"}
        >
          {running ? <Pause /> : <Play />}
        </Button>
        {seconds > 0 && (
          <Button size={compact ? "sm" : "icon"} variant="ghost" onClick={stop} aria-label="Parar">
            <Square />
          </Button>
        )}
      </div>
    </div>
  );
}
