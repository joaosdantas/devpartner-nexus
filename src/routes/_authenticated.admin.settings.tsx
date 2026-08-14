// Admin → Configurações: gestão de categorias de demanda e planos.
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrencyBRL } from "@/lib/entities";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Configurações · DEV Partner Workspace" },
      {
        name: "description",
        content: "Gerencie categorias de demanda e planos comerciais.",
      },
      { property: "og:title", content: "Configurações · DEV Partner Workspace" },
      {
        property: "og:description",
        content: "Gerencie categorias de demanda e planos comerciais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SettingsPage() {
  const session = Route.useRouteContext().session;

  return (
    <AppShell role="admin" session={session} breadcrumb={[{ label: "Configurações" }]}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo de categorias e planos usados em toda a operação.
          </p>
        </header>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>
          <TabsContent value="categories" className="mt-4">
            <CategoriesPanel />
          </TabsContent>
          <TabsContent value="plans" className="mt-4">
            <PlansPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function CategoriesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryRow | null>(null);
  const [confirm, setConfirm] = React.useState<CategoryRow | null>(null);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#f59e0b");

  const { data = [] } = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const openDialog = (row?: CategoryRow) => {
    setEditing(row ?? null);
    setName(row?.name ?? "");
    setColor(row?.color ?? "#f59e0b");
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), slug: slugify(name), color };
      if (editing) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ ...payload, position: data.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Categoria salva");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setConfirm(null);
      toast.success("Categoria removida");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Categorias de demanda</h2>
          <p className="text-xs text-muted-foreground">
            {data.length} categorias cadastradas
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-1.5 size-4" /> Nova categoria
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Nenhuma categoria"
          description="Crie categorias para classificar as demandas."
        />
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.slug}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => openDialog(c)}>
                <Pencil />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => setConfirm(c)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Landing page"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-color">Cor</Label>
              <Input
                id="cat-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-24 p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!name.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Remover categoria?"
        description="As demandas vinculadas ficarão sem categoria."
        onConfirm={() => confirm && deleteMut.mutate(confirm.id)}
      />
    </Card>
  );
}

function PlansPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PlanRow | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    monthly_hours: "0",
    monthly_price: "0",
    sla_hours: "24",
    max_projects: "1",
    description: "",
    is_active: true,
  });

  const { data = [] } = useQuery({
    queryKey: ["plans", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("monthly_price");
      if (error) throw error;
      return data as PlanRow[];
    },
  });

  const openDialog = (row: PlanRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      monthly_hours: String(row.monthly_hours),
      monthly_price: String(row.monthly_price),
      sla_hours: String(row.sla_hours),
      max_projects: String(row.max_projects),
      description: row.description ?? "",
      is_active: row.is_active,
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("plans")
        .update({
          name: form.name.trim(),
          monthly_hours: Number(form.monthly_hours),
          monthly_price: Number(form.monthly_price),
          sla_hours: Number(form.sla_hours),
          max_projects: Number(form.max_projects),
          description: form.description.trim() || null,
          is_active: form.is_active,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Planos comerciais</h2>
      <p className="text-xs text-muted-foreground">
        Horas, preço e SLA oferecidos aos clientes.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card/40 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.tier}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => openDialog(p)}>
                <Pencil />
              </Button>
            </div>
            <p className="mt-3 text-xl font-semibold">
              {formatCurrencyBRL(Number(p.monthly_price))}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>{Number(p.monthly_hours)}h por mês</li>
              <li>SLA de {p.sla_hours}h</li>
              <li>Até {p.max_projects} projetos</li>
              <li>{p.is_active ? "Ativo" : "Inativo"}</li>
            </ul>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="plan-name">Nome</Label>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-hours">Horas / mês</Label>
              <Input
                id="plan-hours"
                type="number"
                value={form.monthly_hours}
                onChange={(e) => setForm({ ...form, monthly_hours: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Preço / mês</Label>
              <Input
                id="plan-price"
                type="number"
                value={form.monthly_price}
                onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-sla">SLA (horas)</Label>
              <Input
                id="plan-sla"
                type="number"
                value={form.sla_hours}
                onChange={(e) => setForm({ ...form, sla_hours: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-projects">Máx. projetos</Label>
              <Input
                id="plan-projects"
                type="number"
                value={form.max_projects}
                onChange={(e) => setForm({ ...form, max_projects: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="plan-desc">Descrição</Label>
              <Input
                id="plan-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="plan-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label htmlFor="plan-active">Plano ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
