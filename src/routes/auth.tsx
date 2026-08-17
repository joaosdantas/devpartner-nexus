import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { seedDemoEnvironment } from "@/lib/demo-seed.functions";
import { ensureDarkTheme } from "@/lib/theme";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // Check role to redirect to correct dashboard
      const userId = data.session.user.id;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const isStaff = (roles ?? []).some((r) =>
        ["admin", "manager", "developer"].includes(r.role as string),
      );
      throw redirect({ to: isStaff ? "/admin/dashboard" : "/workspace/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Entrar · DEV Partner Workspace" },
      { name: "description", content: "Acesse seu workspace na DEV Partner." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    ensureDarkTheme();
  }, []);

  const [tab, setTab] = useState<"login" | "signup" | "forgot">("login");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-6 shadow-xl backdrop-blur md:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Sparkles className="size-4 text-primary" /> DEV Partner
            </Link>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre na plataforma para acessar seu workspace.
          </p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar</TabsTrigger>
              <TabsTrigger value="forgot">Recuperar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <LoginForm
                onSuccess={() => navigate({ to: search.redirect ?? ("/" as string) })}
              />
            </TabsContent>
            <TabsContent value="signup" className="mt-5">
              <SignupForm />
            </TabsContent>
            <TabsContent value="forgot" className="mt-5">
              <ForgotForm />
            </TabsContent>
          </Tabs>

          <DemoBootstrap />
        </motion.div>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoading(false);
          return toast.error(error.message);
        }
        // Decide destination by role.
        const userId = data.user?.id;
        if (userId) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);
          const isStaff = (roles ?? []).some((r) =>
            ["admin", "manager", "developer"].includes(r.role as string),
          );
          setLoading(false);
          toast.success("Login realizado");
          if (isStaff) {
            window.location.assign("/admin/dashboard");
          } else {
            window.location.assign("/workspace/dashboard");
          }
          return;
        }
        setLoading(false);
        onSuccess();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="l-email">Email</Label>
        <Input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="l-pass">Senha</Label>
        <Input id="l-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Entrar
      </Button>
    </form>
  );
}

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success("Conta criada. Verifique seu email.");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="s-name">Nome completo</Label>
        <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s-email">Email</Label>
        <Input id="s-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s-pass">Senha</Label>
        <Input id="s-pass" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Criar conta
      </Button>
    </form>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success("Enviamos um link para redefinir sua senha.");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="f-email">Email</Label>
        <Input id="f-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Enviar link
      </Button>
    </form>
  );
}

function DemoBootstrap() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
      <p className="text-xs font-medium text-muted-foreground">Ambiente de demonstração</p>
      <p className="mt-1 text-sm text-foreground">
        Popule usuários demo (admin@devpartner.com / agencia@teste.com).
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const res = await seedDemoEnvironment();
            toast.success(res.message);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Falha ao popular");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading && <Loader2 className="animate-spin" />} Popular ambiente demo
      </Button>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p><strong className="text-foreground">Admin:</strong> admin@devpartner.com / Admin@123</p>
        <p><strong className="text-foreground">Agência:</strong> agencia@teste.com / Agencia@123</p>
      </div>
    </div>
  );
}
