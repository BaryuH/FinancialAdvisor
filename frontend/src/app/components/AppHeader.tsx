import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Menu,
  Home,
  PieChart,
  BarChart3,
  Receipt,
  Target,
  Calendar as CalendarIcon,
  PenLine,
  Bot,
  UserRound,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "./ui/utils";
import { useLocale, pageTitleKeyForPath } from "../lib/locale";

const NAV_ITEMS: { path: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { path: "/", labelKey: "nav.overview", icon: Home },
    { path: "/reports", labelKey: "nav.reports", icon: BarChart3 },
    { path: "/transactions", labelKey: "nav.transactions", icon: Receipt },
    { path: "/budget", labelKey: "nav.budget", icon: PieChart },
    { path: "/goals", labelKey: "nav.goals", icon: Target },
    { path: "/calendar", labelKey: "nav.calendar", icon: CalendarIcon },
    { path: "/smart-input", labelKey: "nav.smartInput", icon: PenLine },
    { path: "/ai-advisor", labelKey: "nav.aiAdvisor", icon: Bot },
    { path: "/auth", labelKey: "nav.auth", icon: UserRound },
  ];

export function AppHeader() {
  const location = useLocation();
  const { locale, setLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  const titleKey = pageTitleKeyForPath(location.pathname);
  const title = t(titleKey);

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/40 bg-background/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-border/60 dark:bg-background/85 dark:shadow-none"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto max-w-md px-3 pb-2 pt-1">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-2 py-2 shadow-[0_2px_12px_rgba(15,23,42,0.06)]",
            "backdrop-blur-sm dark:border-border dark:bg-card/95 dark:shadow-sm",
          )}
        >
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl text-foreground"
                aria-label={t("nav.overview")}
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100%,20rem)] border-border p-0 flex flex-col gap-0">
              <SheetHeader className="border-b border-border px-4 py-4 text-left">
                <SheetTitle className="text-lg">{t("app.name")}</SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto px-2 py-3">
                <ul className="space-y-1">
                  {NAV_ITEMS.map(({ path, labelKey: key, icon: Icon }) => {
                    const active =
                      path === "/"
                        ? location.pathname === "/"
                        : location.pathname === path || location.pathname.startsWith(`${path}/`);
                    return (
                      <li key={path}>
                        <SheetClose asChild>
                          <Link
                            to={path}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                              active
                                ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-700"
                                : "text-foreground hover:bg-muted",
                            )}
                          >
                            <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-muted-foreground")} />
                            {t(key)}
                          </Link>
                        </SheetClose>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-foreground">
            {title}
          </h1>

          <div
            className="flex shrink-0 items-center rounded-lg border border-border bg-muted/40 p-0.5 text-[11px] font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                locale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("locale.en")}
            </button>
            <button
              type="button"
              onClick={() => setLocale("vi")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                locale === "vi"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("locale.vi")}
            </button>
          </div>

          <ThemeToggle className="h-10 w-10 shrink-0" />
        </div>
      </div>
    </header>
  );
}
