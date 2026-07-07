import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ListChecks,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureDarkTheme } from "@/lib/theme";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const highlights = [
  { icon: ListChecks, title: "Demandas fluídas", desc: "Kanban premium com timer, comentários e IA integrada." },
  { icon: Clock, title: "Horas em tempo real", desc: "Consumo animado do plano com alertas inteligentes." },
  { icon: Users, title: "Multi-workspace", desc: "Alterne entre clientes com um toque, sem fricção." },
  { icon: BarChart3, title: "Relatórios executivos", desc: "Dashboards prontos para diretoria e cliente." },
];

function LandingPage() {
  useEffect(() => {
    ensureDarkTheme();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-info/15 blur-[120px]" />
      </div>

      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg [background-image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">DEV Partner</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/cliente">Sou cliente</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link to="/dashboard">Entrar no workspace</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-success" />
            Novo · Bee Assistant integrada
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            O <span className="gradient-text">workspace premium</span>
            <br /> para agências que entregam.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground">
            Demandas, projetos, horas e clientes em um só lugar. Feito para times
            que querem clareza, velocidade e uma aparência à altura do seu produto.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="lg" asChild>
              <Link to="/dashboard">
                Ver dashboard admin <ArrowRight />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/dashboard/cliente">Ver visão do cliente</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur transition-colors hover:border-border-strong"
            >
              <div className="grid size-10 place-items-center rounded-lg border border-border bg-background/40 text-primary-glow">
                <h.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{h.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{h.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-14 flex items-center justify-center gap-6 text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" /> Setup em minutos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" /> Multi-cliente
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" /> IA nativa
          </span>
        </motion.div>
      </main>
    </div>
  );
}
