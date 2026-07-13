// Client form used by admin. Handles create + edit against the `clients` table.
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_STATUS_OPTIONS } from "@/lib/entities";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientRow | null;
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormProps) {
  const qc = useQueryClient();
  const isEdit = Boolean(client);

  const { data: plans = [] } = useQuery({
    queryKey: ["plans", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, monthly_hours, monthly_price")
        .eq("is_active", true)
        .order("monthly_price");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = React.useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    cnpj: "",
    plan_id: "",
    monthly_hours: 0,
    monthly_value: 0,
    status: "active" as Database["public"]["Enums"]["client_status"],
    notes: "",
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        company_name: client?.company_name ?? "",
        contact_name: client?.contact_name ?? "",
        email: client?.email ?? "",
        phone: client?.phone ?? "",
        cnpj: client?.cnpj ?? "",
        plan_id: client?.plan_id ?? "",
        monthly_hours: Number(client?.monthly_hours ?? 0),
        monthly_value: Number(client?.monthly_value ?? 0),
        status: client?.status ?? "active",
        notes: client?.notes ?? "",
      });
    }
  }, [open, client]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_name: form.company_name.trim(),
        contact_name: form.contact_name || null,
        email: form.email || null,
        phone: form.phone || null,
        cnpj: form.cnpj || null,
        plan_id: form.plan_id || null,
        monthly_hours: form.monthly_hours,
        monthly_value: form.monthly_value,
        status: form.status,
        notes: form.notes || null,
      };
      if (isEdit && client) {
        const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cliente atualizado" : "Cliente criado");
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Auto-fill hours/value when selecting a plan on create.
  React.useEffect(() => {
    if (!form.plan_id || isEdit) return;
    const plan = plans.find((p) => p.id === form.plan_id);
    if (plan) {
      setForm((f) => ({
        ...f,
        monthly_hours: Number(plan.monthly_hours),
        monthly_value: Number(plan.monthly_price),
      }));
    }
  }, [form.plan_id, plans, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Dados cadastrais, plano contratado e horas mensais.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.company_name.trim()) {
              toast.error("Informe o nome da empresa");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="company_name">Empresa *</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="contact_name">Contato</Label>
            <Input
              id="contact_name"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={form.cnpj}
              onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
            />
          </div>
          <div>
            <Label>Plano</Label>
            <Select
              value={form.plan_id || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, plan_id: v === "none" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem plano</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {Number(p.monthly_hours)}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as typeof f.status }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="monthly_hours">Horas / mês</Label>
            <Input
              id="monthly_hours"
              type="number"
              min={0}
              step={0.5}
              value={form.monthly_hours}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthly_hours: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label htmlFor="monthly_value">Mensalidade (R$)</Label>
            <Input
              id="monthly_value"
              type="number"
              min={0}
              step={0.01}
              value={form.monthly_value}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthly_value: Number(e.target.value) }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
