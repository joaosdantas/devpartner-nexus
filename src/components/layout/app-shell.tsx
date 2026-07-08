import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { CommandPalette } from "@/components/app/command-palette";
import type { CrumbItem } from "./app-breadcrumb";
import type { SessionContext } from "@/lib/session.functions";
import { ensureDarkTheme } from "@/lib/theme";

export function AppShell({
  breadcrumb,
  role,
  session,
  children,
}: {
  breadcrumb?: CrumbItem[];
  role: "admin" | "workspace";
  session: SessionContext;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    ensureDarkTheme();
  }, []);

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
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        role={role}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          breadcrumb={breadcrumb}
          onOpenPalette={openPalette}
          session={session}
        />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
