import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { CommandPalette } from "@/components/app/command-palette";
import type { CrumbItem } from "./app-breadcrumb";
import { ensureDarkTheme } from "@/lib/theme";

export function AppShell({
  breadcrumb,
  children,
}: {
  breadcrumb?: CrumbItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    ensureDarkTheme();
  }, []);

  // The palette listens to ⌘K globally; we still expose a trigger from the topbar
  // by dispatching the same shortcut.
  const openPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar breadcrumb={breadcrumb} onOpenPalette={openPalette} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
