import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ensureDarkTheme } from "@/lib/theme";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · DEV Partner" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDarkTheme();
    // Supabase places recovery tokens in the URL hash; the client picks them up automatically.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-border bg-card/70 p-6 shadow-xl backdrop-blur">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma nova senha para sua conta.
        </p>
        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!ready) return toast.error("Link inválido ou expirado.");
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password });
            setLoading(false);
            if (error) return toast.error(error.message);
            toast.success("Senha atualizada.");
            navigate({ to: "/" });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pw">Nova senha</Label>
            <Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !ready}>
            {loading && <Loader2 className="animate-spin" />} Salvar
          </Button>
        </form>
      </div>
    </div>
  );
}
