import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListChecks,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/app/kpi-card";
import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { Timer } from "@/components/app/timer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · DEV Partner Workspace" },
      { name: "description", content: "Visão geral de demandas, projetos e horas do workspace." },
    ],
  }),
  component: DashboardPage,
});

const hoursData = [
  { day: "Seg", h: 6.2 },
  { day: "Ter", h: 7.4 },
  { day: "Qua", h: 5.8 },
  { day: "Qui", h: 8.1 },
  { day: "Sex", h: 7.9 },
  { day: "Sáb", h: 2.4 },
  { day: "Dom", h: 0.6 },
];

const statusData = [
  { name: "Em andamento", value: 12, color: "var(--primary)" },
  { name: "Em revisão", value: 5, color: "var(--warning)" },
  { name: "Concluídas", value: 28, color: "var(--success)" },
  { name: "Bloqueadas", value: 2, color: "var(--destructive)" },
];

const throughput = [
  { m: "Jan", entregues: 22 },
  { m: "Fev", entregues: 28 },
  { m: "Mar", entregues: 25 },
  { m: "Abr", entregues: 34 },
  { m: "Mai", entregues: 31 },
  { m: "Jun", entregues: 42 },
  { m: "Jul", entregues: 47 },
];

const recentTasks = [
  { code: "DEM-142", title: "Ajustar responsividade do checkout", client: "Nexabee", status: "in_progress" as const, priority: "high" as const },
  { code: "DEM-141", title: "Integrar webhook Stripe", client: "Atelier Studio", status: "in_review" as const, priority: "urgent" as const },
  { code: "DEM-140", title: "Refatorar componente Sidebar", client: "DEV Partner", status: "todo" as const, priority: "normal" as const },
  { code: "DEM-139", title: "Deploy da landing v3", client: "Nexabee", status: "done" as const, priority: "normal" as const },
  { code: "DEM-138", title: "Otimizar imagens do blog", client: "Casa Verde", status: "blocked" as const, priority: "high" as const },
];

const activity = [
  { who: "Ana Costa", what: "concluiu a demanda", target: "DEM-139", when: "há 12 min", color: "success" },
  { who: "Carlos M.", what: "comentou em", target: "DEM-142", when: "há 34 min", color: "info" },
  { who: "Bee", what: "gerou changelog para", target: "Sprint 08", when: "há 1h", color: "primary" },
  { who: "Marina L.", what: "criou o projeto", target: "Portal Nexabee", when: "há 2h", color: "primary" },
  { who: "João R.", what: "iniciou timer em", target: "DEM-140", when: "há 3h", color: "warning" },
];

const clients = [
  { name: "Nexabee", plan: "Enterprise", used: 42, total: 60 },
  { name: "Atelier Studio", plan: "Pro", used: 18, total: 30 },
  { name: "Casa Verde", plan: "Starter", used: 9, total: 15 },
  { name: "Voa Lab", plan: "Basic", used: 4, total: 10 },
];

const dotColor: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
};

function DashboardPage() {
  return (
    <AppShell breadcrumb={[{ label: "Workspace", to: "/dashboard" }, { label: "Dashboard" }]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Bom dia, Marco
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              Visão do workspace
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Um resumo em tempo real das suas demandas, projetos e horas contratadas.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary">
              <Sparkles /> Pergunte à Bee
            </Button>
            <Button variant="primary" asChild>
              <Link to="/dashboard">
                Nova demanda <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} label="Demandas ativas" value="47" hint="+8 esta semana" icon={ListChecks} accent="primary" trend={{ value: 12.4, label: "vs. semana anterior" }} />
          <KpiCard index={1} label="Horas trabalhadas" value="184h" hint="Meta 200h" icon={Clock} accent="info" trend={{ value: 6.1, label: "vs. semana anterior" }} />
          <KpiCard index={2} label="Projetos ativos" value="12" hint="3 novos este mês" icon={FolderKanban} accent="success" trend={{ value: 2, label: "vs. mês anterior" }} />
          <KpiCard index={3} label="Clientes ativos" value="26" hint="Retenção 96%" icon={Users} accent="warning" trend={{ value: -1.2, label: "vs. mês anterior" }} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="col-span-1 border-border/70 bg-card/60 p-5 backdrop-blur lg:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Horas trabalhadas</h2>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </div>
              <Tabs defaultValue="7d">
                <TabsList className="h-8">
                  <TabsTrigger value="7d" className="text-xs">7d</TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs">30d</TabsTrigger>
                  <TabsTrigger value="90d" className="text-xs">90d</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={hoursData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="h" stroke="var(--primary)" strokeWidth={2} fill="url(#hArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/70 bg-card/60 p-5 backdrop-blur">
            <h2 className="text-base font-semibold">Distribuição por status</h2>
            <p className="text-xs text-muted-foreground">Demandas em aberto</p>
            <div className="mt-4 h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={45} outerRadius={70} stroke="var(--background)" strokeWidth={2}>
                    {statusData.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {statusData.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{s.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Throughput + Timer */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/60 p-5 backdrop-blur lg:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Entregas mensais</h2>
                <p className="text-xs text-muted-foreground">Demandas concluídas</p>
              </div>
              <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="mr-1 inline size-3" /> +34% no trimestre
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={throughput} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="entregues" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/70 bg-card/60 p-5 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">Timer ativo</h2>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Foco
                </span>
              </div>
              <Timer taskLabel="DEM-142 · Ajustar responsividade" initialSeconds={1547} running />
            </Card>
            <Card className="border-border/70 bg-card/60 p-5 backdrop-blur">
              <h2 className="text-base font-semibold">Atalhos rápidos</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm">Nova demanda</Button>
                <Button variant="secondary" size="sm">Novo projeto</Button>
                <Button variant="secondary" size="sm">Novo cliente</Button>
                <Button variant="secondary" size="sm">Convidar time</Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent + Activity + Clients */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/60 p-0 backdrop-blur xl:col-span-2">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Últimas demandas</h2>
                <p className="text-xs text-muted-foreground">Atualizado agora</p>
              </div>
              <Button variant="ghost" size="sm">Ver todas <ArrowRight /></Button>
            </div>
            <ul className="divide-y divide-border/70">
              {recentTasks.map((t, i) => (
                <motion.li
                  key={t.code}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono tracking-wider">{t.code}</span>
                      <span>·</span>
                      <span className="truncate">{t.client}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium">{t.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </motion.li>
              ))}
            </ul>
          </Card>

          <Card className="border-border/70 bg-card/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Atividade</h2>
                <p className="text-xs text-muted-foreground">Timeline</p>
              </div>
              <Activity className="size-4 text-muted-foreground" />
            </div>
            <ol className="relative space-y-4 border-l border-border/70 pl-5">
              {activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[26px] top-1 grid size-3 place-items-center rounded-full ring-4 ring-background ${dotColor[a.color] ?? "bg-muted"}`} />
                  <p className="text-sm">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    <span className="font-mono text-xs">{a.target}</span>
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    {a.when}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/60 p-0 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Clientes com maior consumo</h2>
              <p className="text-xs text-muted-foreground">Horas do plano</p>
            </div>
            <Button variant="ghost" size="sm">
              Ver todos <ArrowRight />
            </Button>
          </div>
          <ul className="divide-y divide-border/70">
            {clients.map((c) => {
              const pct = Math.round((c.used / c.total) * 100);
              const state = pct >= 90 ? "destructive" : pct >= 70 ? "warning" : "primary";
              const bar =
                state === "destructive"
                  ? "from-destructive to-destructive/60"
                  : state === "warning"
                    ? "from-warning to-warning/60"
                    : "from-primary to-primary-glow";
              return (
                <li key={c.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5">
                  <Avatar className="size-9 border border-border">
                    <AvatarFallback className="text-xs">{c.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.plan}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full bg-gradient-to-r ${bar}`}
                      />
                    </div>
                  </div>
                  <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.used}h</span> / {c.total}h
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
