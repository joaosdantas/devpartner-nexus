import * as React from "react";
import { UploadCloud, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  hint?: string;
}

function humanSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function FileUpload({
  accept,
  multiple = true,
  maxSizeMB = 20,
  onFilesChange,
  className,
  hint,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAdd = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter(
      (f) => f.size <= maxSizeMB * 1024 * 1024,
    );
    const next = multiple ? [...files, ...arr] : arr.slice(0, 1);
    setFiles(next);
    onFilesChange?.(next);
  };

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    onFilesChange?.(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleAdd(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/80 bg-card/40 hover:border-border-strong hover:bg-card/60",
        )}
      >
        <div className="grid size-10 place-items-center rounded-lg border border-border bg-background/40 text-muted-foreground">
          <UploadCloud className="size-5" />
        </div>
        <div className="text-sm">
          <span className="font-medium text-foreground">Clique para enviar</span>{" "}
          <span className="text-muted-foreground">ou arraste até aqui</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {hint ?? `Máx. ${maxSizeMB}MB por arquivo`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleAdd(e.target.files)}
        />
      </button>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {humanSize(f.size)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(i)}
                aria-label="Remover"
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
