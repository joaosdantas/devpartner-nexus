// Anexos de demanda: upload para o bucket privado `attachments` + registro
// em `task_attachments`. Download via signed URL.
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Paperclip, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/app/file-upload";
import { supabase } from "@/integrations/supabase/client";

function humanSize(b: number) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function TaskAttachments({
  taskId,
  userId,
}: {
  taskId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const [pending, setPending] = React.useState<File[]>([]);
  const [resetKey, setResetKey] = React.useState(0);

  const listQ = useQuery({
    queryKey: ["task-attachments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMut = useMutation({
    mutationFn: async () => {
      for (const file of pending) {
        const path = `${taskId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("attachments")
          .upload(path, file, { contentType: file.type || undefined });
        if (upErr) throw upErr;
        const { error } = await supabase.from("task_attachments").insert({
          task_id: taskId,
          uploader_id: userId,
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setPending([]);
      setResetKey((k) => k + 1);
      toast.success("Anexos enviados");
      qc.invalidateQueries({ queryKey: ["task-attachments", taskId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (row: { id: string; file_path: string }) => {
      await supabase.storage.from("attachments").remove([row.file_path]);
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anexo removido");
      qc.invalidateQueries({ queryKey: ["task-attachments", taskId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const download = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Falha ao gerar link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const items = listQ.data ?? [];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Paperclip className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Anexos</h2>
        <span className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {items.length}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2"
            >
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {humanSize(Number(a.size_bytes ?? 0))}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Baixar"
                onClick={() => download(a.file_path)}
              >
                <Download />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remover"
                onClick={() => deleteMut.mutate({ id: a.id, file_path: a.file_path })}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3">
        <FileUpload key={resetKey} onFilesChange={setPending} maxSizeMB={20} />
        {pending.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={() => uploadMut.mutate()}
              disabled={uploadMut.isPending}
            >
              {uploadMut.isPending ? "Enviando..." : `Enviar ${pending.length} arquivo(s)`}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
