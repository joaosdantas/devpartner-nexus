import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/app/kpi-card";
import { HoursProgress } from "@/components/app/hours-progress";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/dashboard/cliente")({
  head: () => ({
    meta: [
      { title: "Meu plano · DEV Partner Workspace" },
      {
        name: "description",
        content: "Acompanhe suas horas contratadas, demandas ativas e prazos.",
      },
    ],
  }),
  component: ClientDashboardPage,
});

const consumo = [
  { m: "S1", h: 6 },
  { m: "S2", h: 9 },
  { m: "S3", h: 11 },
  { m: "S4", h: 14 },
  { m: "S5", h: 17 },
  { m: "S6", h: 22 },
];

const demandas = [
  { code: "DEM-142", title: "Ajustar responsividade do checkout", status: "in_progress" as const, priority: "high" as const, updated: "há 5 min" },
  { code: "DEM-141", title: "Integração com Stripe", status: "in_review" as const, priority: "urgent" as const, updated: "há 1h" },
  { code: "DEM-138", title: "Otimizar imagens do blog", status: "blocked" as const, priority: "high" as const, updated: "há 3h" },
  { code: "DEM-137", title: "Refinar copy do hero", status: "todo" as const, priority: "normal" as const, updated: "ontem" },
];

const prazos = [
  { title: "Entrega Sprint 09", when: "em 3 dias", tag: "Sprint" },
  { title: "Revisão da campanha", when: "em 5 dias", tag: "Campanha" },
  { title: "Lançamento do portal", when: "em 12 dias", tag: "Portal" },
];

const comentarios = [
  { who: "Ana Costa", text: "Ajustei o espaçamento do hero, dá uma olhada!", when: "há 12 min", target: "DEM-142" },
  { who: "Carlos M.", text: "Podemos aprovar essa entrega hoje?", when: "há 1h", target: "DEM-141" },
  { who: "Bee", text: "Resumi as últimas 8 atividades do time.", when: "há 2h", target: "Sprint 09" },
];

function ClientDashboardPage() {
  const used = 22;
  const total = 60;
  const remaining = total - used;

  return (
    <AppShell
      breadcrumb={[
        { label: "Meu workspace", to: "/dashboard/cliente" },
        { label: "Visão geral" },
      ]}
    >
      <div className="space-y-8">
        {/* Header hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-info/10 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <ShieldCheck className="size-3 text-success" /> Plano Enterprise · Ativo
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                Olá, Nexabee 👋
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Você tem <span className="font-semibold text-foreground">{remaining}h</span> disponíveis
                este mês. Continue acompanhando o progresso das suas demandas em tempo real.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary">
                  <Sparkles /> Nova demanda
                </Button>
                <Button variant="secondary">Ver histórico</Button>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/40 p-5">
              <HoursProgress used={used} total={total} />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard index={0} label="Horas contratadas" value={`${total}h`} hint="Ciclo mensal" icon={Clock} accent="primary" />
          <KpiCard index={1} label="Horas utilizadas" value={`${used}h`} hint={`${Math.round((used / total) * 100)}% do plano`} icon={Clock} accent="info" trend={{ value: 8, label: "vs. mês anterior" }} />
          <KpiCard index={2} label="Horas restantes" value={`${remaining}h`} hint="Renova em 12 dias" icon={CalendarClock} accent="success" />
          <KpiCard index={3} label="Demandas concluídas" value="18" hint="Neste ciclo" icon={CheckCircle2} accent="warning" trend={{ value: 14, label: "vs. mês anterior" }} />
        </div>

        {/* Consumo + Prazos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/60 p-5 backdrop-blur lg:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Consumo semanal</h2>
                <p className="text-xs text-muted-foreground">Horas acumuladas no ciclo</p>
              </div>
              <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary-glow">
                Ciclo atual
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={consumo} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="h" stroke="var(--primary)" strokeWidth={2} fill="url(#cArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/70 bg-card/60 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Próximos prazos</h2>
              <CalendarClock className="size-4 text-muted-foreground" />
            </div>
            <ul className="space-y-3">
              {prazos.map((p, i) => (
                <motion.li
                  key={p.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/40 p-3"
                >
                  <div className="grid size-10 place-items-center rounded-lg [background-image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.when}</p>
                  </div>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.tag}
                  </span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Demandas + Comentários */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/60 p-0 backdrop-blur xl:col-span-2">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Últimas demandas</h2>
                <p className="text-xs text-muted-foreground">Acompanhe o andamento</p>
              </div>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </div>
            <ul className="divide-y divide-border/70">
              {demandas.map((d) => (
                <li
                  key={d.code}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono tracking-wider">{d.code}</span>
                      <span>·</span>
                      <span>{d.updated}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium">{d.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={d.priority} />
                    <StatusBadge status={d.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-border/70 bg-card/60 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Últimos comentários</h2>
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
            <ul className="space-y-4">
              {comentarios.map((c, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex gap-3"
                >
                  <Avatar className="size-8 border border-border">
                    <AvatarFallback className="text-[10px]">
                      {c.who.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{c.who}</span>
                      <span className="font-mono text-muted-foreground">{c.target}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/90">{c.text}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground/70">
                      {c.when}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
