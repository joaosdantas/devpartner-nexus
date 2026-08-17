// Perfil do usuário: visualização e edição de dados pessoais.
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionContext } from "@/lib/session.functions";
import { getAccessToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Meu Perfil · DEV Partner Workspace" }],
  }),
  beforeLoad: async ({}) => {
    const accessToken = await getAccessToken();
    const session = await getSessionContext({ data: { accessToken } });
    return { session };
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = Route.useRouteContext();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["profile", session.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = React.useState({
    full_name: "",
    email: "",
    phone: "",
    position: "",
  });

  React.useEffect(() => {
    if (profileQ.data) {
      setForm({
        full_name: profileQ.data.full_name ?? "",
        email: profileQ.data.email ?? "",
        phone: profileQ.data.phone ?? "",
        position: profileQ.data.position ?? "",
      });
    }
  }, [profileQ.data]);

  const updateMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name || null,
          phone: form.phone || null,
          position: form.position || null,
        })
        .eq("id", session.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["profile", session.userId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const initials = form.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <AppShell
      role={session.isStaff ? "admin" : "workspace"}
      session={session}
      breadcrumb={[{ label: "Meu Perfil" }]}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>

        <Card className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-20 border-2 border-border">
                <AvatarImage src={profileQ.data?.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 rounded-full border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Alterar foto"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <div>
              <p className="text-lg font-medium">{form.full_name || "Sem nome"}</p>
              <p className="text-sm text-muted-foreground">{session.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {session.roles?.[0] ?? "Usuário"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Informações pessoais
          </h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={form.email}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado aqui.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="Ex: Desenvolvedor"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending}
            >
              <Save className="mr-1.5 size-4" />
              {updateMut.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
