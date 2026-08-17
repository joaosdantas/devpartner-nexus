import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export interface CommandPaletteAction {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

interface CommandPaletteProps {
  extraActions?: CommandPaletteAction[];
}

export function CommandPalette({ extraActions = [] }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar demandas, projetos, clientes..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => go("/admin/dashboard")}>
            <LayoutDashboard /> Dashboard
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/workspace/dashboard")}>
            <BarChart3 /> Dashboard do cliente
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/tasks")}>
            <ListChecks /> Demandas
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/projects")}>
            <FolderKanban /> Projetos
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/clients")}>
            <Users /> Clientes
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/settings")}>
            <Settings /> Configurações
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações">
          <CommandItem>
            <Timer /> Iniciar timer
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Sparkles /> Perguntar à Bee (IA)
            <CommandShortcut>⌘ J</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Search /> Busca global
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/settings")}>
            <Settings /> Configurações
          </CommandItem>
        </CommandGroup>
        {extraActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Sugestões">
              {extraActions.map((a) => {
                const Icon = a.icon;
                return (
                  <CommandItem
                    key={a.id}
                    onSelect={() => {
                      setOpen(false);
                      a.onSelect();
                    }}
                  >
                    {Icon && <Icon className="size-4" />} {a.label}
                    {a.shortcut && (
                      <CommandShortcut>{a.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
