import * as React from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppBreadcrumb, type CrumbItem } from "./app-breadcrumb";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Logo } from "./logo";

export function AppTopbar({
  breadcrumb,
  onOpenPalette,
  mobileNav,
}: {
  breadcrumb?: CrumbItem[];
  onOpenPalette?: () => void;
  mobileNav?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/70 px-3 backdrop-blur md:px-5">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            aria-label="Abrir menu"
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center px-4">
            <Logo />
          </div>
          <div className="px-2 pb-4">{mobileNav}</div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:block">
        <WorkspaceSwitcher />
      </div>

      {breadcrumb && (
        <div className="ml-1 hidden lg:block">
          <AppBreadcrumb items={breadcrumb} />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={onOpenPalette}
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:flex"
        >
          <Search className="size-4" />
          <span className="min-w-[180px] text-left">Buscar em tudo…</span>
          <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <Button
          size="icon"
          variant="ghost"
          className="sm:hidden"
          onClick={onOpenPalette}
          aria-label="Buscar"
        >
          <Search />
        </Button>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
