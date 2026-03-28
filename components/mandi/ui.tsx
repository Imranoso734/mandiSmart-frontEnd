"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CircleDollarSign,
  ChevronLeft,
  Download,
  Loader2,
  LogOut,
  Menu,
  Monitor,
  Moon,
  MoveLeft,
  Plus,
  Printer,
  Search,
  ReceiptText,
  RefreshCcw,
  Settings,
  ShoppingBag,
  SunMedium,
  Truck,
  UserCog,
  Users,
  Wallet,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { authApi, tenantApi } from "@/lib/mandi/api";
import { appName, sidebarLinks } from "@/lib/mandi/constants";
import { sessionStore } from "@/lib/mandi/session";
import type { SessionUser, UserRole } from "@/lib/mandi/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/mandi/utils";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(() =>
    typeof window !== "undefined" ? sessionStore.getUser() : null,
  );
  

  useEffect(() => {
    setUser(sessionStore.getUser());
  }, []);

  return user;
}

export function useTenant() {
  return useQuery({
    queryKey: ["tenant", "me"],
    queryFn: tenantApi.me,
    staleTime: 60_000,
  });
}

function CenterLoader({
  title = "انتظار کریں",
  subtitle,
  overlay = false,
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  overlay?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        overlay
          ? "fixed inset-0 z-[90] bg-[radial-gradient(circle_at_center,rgba(252,250,244,0.72),rgba(252,250,244,0.52))] backdrop-blur-[2px] dark:bg-[radial-gradient(circle_at_center,rgba(8,17,27,0.72),rgba(8,17,27,0.52))]"
          : "min-h-[260px] rounded-[1.75rem] border border-white/70 bg-white/70 dark:border-white/10 dark:bg-slate-950/60",
      )}
    >
      <div
        className={cn(
          "inline-flex items-center gap-3 text-center",
          compact
            ? "rounded-full border border-[var(--brand-line)] bg-white/95 px-5 py-3 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-slate-950/92"
            : "rounded-full border border-[var(--brand-line)] bg-white/96 px-6 py-3.5 shadow-[0_16px_40px_-26px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950/92",
        )}
      >
        <div className="relative flex size-5 items-center justify-center">
          <Loader2 className="relative z-10 size-4 animate-spin text-[var(--brand-forest)] dark:text-emerald-300" />
        </div>
        <div className="flex flex-col items-start text-right">
          <p className="font-heading text-[1.6rem] leading-none text-slate-900 dark:text-white">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-[0.92rem] text-slate-600 dark:text-slate-300">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GlobalApiLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [manualRequests, setManualRequests] = useState(0);
  const busy = isFetching + isMutating + manualRequests > 0;
  const [visible, setVisible] = useState(false);
  const [holdVisible, setHoldVisible] = useState(false);

  useEffect(() => {
    const onLoaderEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: "start" | "end" }>).detail;
      if (detail?.type === "start") {
        setManualRequests((count) => count + 1);
        return;
      }

      if (detail?.type === "end") {
        setManualRequests((count) => Math.max(0, count - 1));
      }
    };

    window.addEventListener("mandi:api-loader", onLoaderEvent as EventListener);
    return () => window.removeEventListener("mandi:api-loader", onLoaderEvent as EventListener);
  }, []);

  useEffect(() => {
    if (!busy) {
      if (!visible) {
        setHoldVisible(false);
        return;
      }

      setHoldVisible(true);
      const hideTimer = window.setTimeout(() => {
        setVisible(false);
        setHoldVisible(false);
      }, 500);

      return () => window.clearTimeout(hideTimer);
    }

    if (visible) {
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 220);
    return () => window.clearTimeout(timer);
  }, [busy, visible]);

  if (!visible && !holdVisible) return null;

  return (
    <CenterLoader
      title={isMutating + manualRequests > 0 ? "انتظار کریں" : "انتظار کریں"}
      subtitle={isMutating + manualRequests > 0 ? "درخواست پر کام ہو رہا ہے" : "API response کا انتظار ہے"}
      overlay
      compact
    />
  );
}
export function AuthGuard({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const [ready, setReady] = useState(false);
  const token = typeof window !== "undefined" ? sessionStore.getToken() : null;

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: !!token,
    retry: 1,
  });

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (meQuery.isSuccess) {
      sessionStore.setUser(meQuery.data);
      setReady(true);
    }

    if (meQuery.isError) {
      sessionStore.clear();
      router.replace("/login");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isSuccess, router, token]);

  if (!token || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-soft)] dark:bg-[linear-gradient(180deg,#09131f_0%,#0d1724_100%)]">
        <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white px-5 py-3 text-sm text-slate-700 shadow-lg dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-200">
          <Loader2 className="size-4 animate-spin" />
          انتظار کریں
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();
  const tenantQuery = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("mandi-sidebar-collapsed");
    setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mandi-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const visibleLinks = sidebarLinks.filter((item) =>
    item.roles.includes((user?.role ?? "OPERATOR") as UserRole),
  );

  const pageTitle = useMemo(() => {
    const current =
      visibleLinks.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ??
      sidebarLinks.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));
    return current?.title ?? "منڈی اسمارٹ";
  }, [pathname, visibleLinks]);

  const breadcrumbs = useMemo(() => {
    const segmentLabels: Record<string, string> = {
      dashboard: "ڈیش بورڈ",
      customers: "گاہک",
      suppliers: "سپلائر",
      consignments: "مال / گاڑی",
      sales: "فروخت",
      payments: "وصولی",
      expenses: "خرچے",
      reports: "رپورٹس",
      users: "آپریٹرز",
      settings: "سیٹنگز",
      "daily-sales": "روزانہ فروخت",
      "customer-ledger": "گاہک کھاتہ",
      "consignment-summary": "مال کا خلاصہ",
      "supplier-settlement": "سپلائر حساب",
    };

    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length) {
      return [{ href: "/dashboard", label: "ڈیش بورڈ", current: true }];
    }

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const previous = segments[index - 1];
      const isIdSegment =
        index > 0 &&
        ["customers", "suppliers", "consignments"].includes(previous) &&
        !segmentLabels[segment];

      return {
        href,
        label: isIdSegment ? "تفصیل" : segmentLabels[segment] ?? segment,
        current: index === segments.length - 1,
      };
    });
  }, [pathname]);

  const sidebarIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "/dashboard": LayoutDashboard,
    "/customers": Users,
    "/suppliers": ShoppingBag,
    "/consignments": Truck,
    "/sales": CircleDollarSign,
    "/payments": Wallet,
    "/expenses": ReceiptText,
    "/reports": BookOpen,
    "/users": UserCog,
    "/settings": Settings,
  };

  const sidebarGroups = [
    {
      title: "اہم کام",
      items: visibleLinks.filter((item) =>
        ["/dashboard", "/sales", "/payments", "/expenses", "/consignments"].includes(item.href),
      ),
    },
    {
      title: "پارٹیاں اور حساب",
      items: visibleLinks.filter((item) =>
        ["/customers", "/suppliers", "/reports"].includes(item.href),
      ),
    },
    {
      title: "نظام",
      items: visibleLinks.filter((item) =>
        ["/users", "/settings"].includes(item.href),
      ),
    },
  ].filter((group) => group.items.length > 0);

  const logout = () => {
    sessionStore.clear();
    toast.success("آپ کامیابی سے لاگ آؤٹ ہو گئے");
    router.push("/login");
  };

  const desktopSidebarWidth = collapsed ? "lg:w-[5.4rem]" : "lg:w-[15.5rem]";
  const desktopContentPadding = collapsed ? "lg:pr-[5.4rem]" : "lg:pr-[15.5rem]";

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground dark:bg-[linear-gradient(180deg,#09131f_0%,#0d1724_100%)]">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-screen w-[16rem] flex-col overflow-hidden border-l border-white/8 bg-[#2f6f45] py-3 shadow-[0_24px_60px_-32px_rgba(2,8,23,0.72)] transition-all duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full",
          collapsed ? "px-2.5" : "px-3",
          desktopSidebarWidth,
        )}
      >
        {collapsed ? (
          <div className="flex items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/6 py-2 text-white">
            <div className="flex items-center justify-between lg:justify-center">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/12 bg-white/8 font-heading text-2xl">م</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <MoveLeft className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.7rem] border border-white/10 bg-white/6 p-3 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-[1.8rem] leading-none">{appName}</p>
                <p className="mt-1 text-sm text-white/70">{tenantQuery.data?.name ?? "منڈی کا حساب"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <MoveLeft className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <TooltipProvider>
          <ScrollArea className="mt-4 min-h-0 flex-1">
            <nav className={cn("space-y-1.5", collapsed ? "px-0.5" : "px-0.5")}>
              {visibleLinks.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = sidebarIconMap[item.href];

                const linkNode = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-[1.05rem] transition-all duration-200",
                      collapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2.5",
                      active
                        ? "bg-[#3f874d] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-white/92 hover:bg-white/7 hover:text-white",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}>
                      <span
                        className={cn(
                          "flex shrink-0 items-center justify-center rounded-xl transition",
                          collapsed ? "size-10" : "size-9",
                          active ? "bg-white/8 text-white" : "text-white/88 group-hover:text-white",
                        )}
                      >
                        {Icon ? <Icon className={cn(collapsed ? "size-5" : "size-4.5")} /> : null}
                      </span>
                      {!collapsed ? (
                        <span className={cn("truncate text-[1.26rem] leading-8", active ? "font-heading" : "font-medium")}>
                          {item.title}
                        </span>
                      ) : null}
                    </span>
                    {!collapsed && active ? <ChevronLeft className="size-4 text-white/90" /> : null}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10}>{item.title}</TooltipContent>
                  </Tooltip>
                ) : (
                  linkNode
                );
              })}
            </nav>
          </ScrollArea>

          <div className="mt-3 shrink-0 rounded-[1.25rem] border border-white/10 bg-white/6 p-2.5">
          {!collapsed ? (
            <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-white">
              <div className="min-w-0">
                <p className="truncate text-xs text-white/60">کام کرنے والا</p>
                <p className="truncate text-sm font-semibold text-white">{user?.name ?? "..."}</p>
              </div>
              <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[11px] text-white/75">
                {user?.role === "OWNER" ? "مالک" : "مشی"}
              </span>
            </div>
          ) : (
            <div className="mb-2.5 flex justify-center rounded-xl bg-white/6 px-2 py-2.5 text-white">
              <span className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/10 text-base font-semibold">
                {(user?.name ?? "؟").slice(0, 1)}
              </span>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white transition hover:bg-white/12"
                >
                  <LogOut className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={10}>لاگ آؤٹ</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white transition hover:bg-white/12"
            >
              <LogOut className="size-4" />
              لاگ آؤٹ
            </button>
          )}
          </div>
        </TooltipProvider>
      </aside>

      <div className={desktopContentPadding}>
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3 px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed((value) => !value)}
              >
                <Menu className="size-4" />
              </Button>
              <div>
                <p className="font-heading text-[2.2rem] text-slate-900 dark:text-white">{pageTitle}</p>
                <p className="text-base text-slate-500 dark:text-slate-400">
                  {tenantQuery.data?.name ?? "کھل رہا ہے"}
                </p>
                {breadcrumbs.length > 1 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-500 dark:text-slate-400">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.href} className="flex items-center gap-2">
                        {index > 0 ? <ChevronLeft className="size-4" /> : null}
                        {crumb.current ? (
                          <span className="font-medium text-slate-700 dark:text-slate-200">{crumb.label}</span>
                        ) : (
                          <Link href={crumb.href} className="transition hover:text-slate-900 dark:hover:text-white">
                            {crumb.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="rounded-3xl border border-[var(--brand-sand)] bg-[linear-gradient(180deg,#fffaf1,#f8efde)] px-4 py-2 text-right shadow-sm dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.05))]">
                <p className="text-base text-slate-500 dark:text-slate-400">{user?.role === "OWNER" ? "مالک" : "مشی"}</p>
                <p className="font-semibold text-slate-900 dark:text-white">{user?.name ?? "..."}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1700px] px-4 py-5 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  );
}

export function RoleGuard({
  roles,
  children,
  title = "یہ حصہ محدود ہے",
  description = "آپ کے رول کے لئے یہ صفحہ دستیاب نہیں۔",
}: {
  roles: UserRole[];
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const user = useSession();

  if (!user) {
    return <LoadingState title="اجازت چیک ہو رہی ہے" />;
  }

  if (!roles.includes(user.role)) {
    return <EmptyState title={title} description={description} />;
  }

  return <>{children}</>;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme ?? resolvedTheme ?? "light") : "light";
  const CurrentIcon =
    currentTheme === "dark" ? Moon : currentTheme === "system" ? Monitor : SunMedium;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-2xl border-white/50 bg-white/80 text-slate-800 shadow-sm hover:bg-white dark:border-white/12 dark:bg-white/8 dark:text-white dark:hover:bg-white/12"
        >
          <CurrentIcon className="size-4" />
          {currentTheme === "dark" ? "گہرا رنگ" : currentTheme === "system" ? "سسٹم کے مطابق" : "ہلکا رنگ"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-2xl border-white/60 bg-white/95 dark:border-white/10 dark:bg-slate-950 dark:text-white">
        <DropdownMenuLabel>رنگ چنیں</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <SunMedium className="size-4" />
            ہلکا رنگ
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4" />
            گہرا رنگ
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="size-4" />
            سسٹم کے مطابق
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,246,238,0.94))] p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.78))] lg:flex-row lg:items-center lg:justify-between lg:p-7">
      <div className="space-y-2">
        <h1 className="font-heading text-[2.8rem] text-slate-950 dark:text-white lg:text-[3.4rem]">{title}</h1>
        {description ? <p className="max-w-3xl text-[1.12rem] leading-9 text-slate-600 dark:text-slate-300">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}

export function SummaryCards({
  items,
}: {
  items: Array<{ title: string; value: string; help?: string; tone?: "warm" | "success" | "danger" | "default" }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.title}
          className={cn(
            "overflow-hidden border shadow-[0_14px_28px_-24px_rgba(15,23,42,0.25)]",
            item.tone === "warm" && "border-[#e7d09a] bg-[linear-gradient(180deg,#fffdf8,#fff8e8)] dark:bg-[linear-gradient(135deg,rgba(96,66,22,0.4),rgba(49,34,12,0.55))]",
            item.tone === "success" && "border-[#bcd6c3] bg-[linear-gradient(180deg,#f5fbf5,#edf7ee)] dark:bg-[linear-gradient(135deg,rgba(8,80,54,0.55),rgba(8,48,35,0.62))]",
            item.tone === "danger" && "border-[#edb9b9] bg-[linear-gradient(180deg,#fff8f8,#fff0ef)] dark:bg-[linear-gradient(135deg,rgba(108,32,32,0.52),rgba(58,20,20,0.65))]",
            (!item.tone || item.tone === "default") && "border-[var(--brand-line)] bg-[linear-gradient(180deg,#ffffff,#fdfaf5)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.86))]",
            "dark:border-white/10",
          )}
        >
          <CardHeader className="gap-2 p-4 pb-3">
            <CardDescription className="text-[1.12rem] text-slate-700 dark:text-slate-300">{item.title}</CardDescription>
            <CardTitle className={cn(
              "font-heading text-[2.05rem] leading-tight dark:text-white lg:text-[2.2rem]",
              item.tone === "success" && "text-[var(--brand-forest)]",
              item.tone === "warm" && "text-[#c6951f]",
              item.tone === "danger" && "text-[#d23c3c]",
            )}>{item.value}</CardTitle>
          </CardHeader>
          {item.help ? (
            <CardContent className={cn(
              "px-4 pt-0 pb-4 text-[1.04rem] dark:text-slate-300",
              item.tone === "success" && "text-[var(--brand-forest)]/80",
              item.tone === "warm" && "text-[#9f7a22]",
              item.tone === "danger" && "text-[#b35050]",
              (!item.tone || item.tone === "default") && "text-slate-600",
            )}>{item.help}</CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,238,0.95))] shadow-[0_18px_36px_-30px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.78))]">
      <CardHeader className="flex flex-col gap-3 border-b border-[var(--brand-line)] p-6 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="font-heading text-[2.25rem] dark:text-white">{title}</CardTitle>
          {description ? <CardDescription className="text-[1.08rem] dark:text-slate-300">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-7">{children}</CardContent>
    </Card>
  );
}

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";

  return (
    <Badge variant="outline" className={cn("rounded-full border px-3 py-1 text-sm", className)}>
      {label}
    </Badge>
  );
}

export function SearchToolbar({
  search,
  onSearchChange,
  filters,
  action,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--brand-line)] bg-[var(--surface-soft)] p-3 dark:border-white/10 dark:bg-slate-900/45 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:max-w-sm md:flex-1">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="تلاش کریں"
            className="bg-white pr-11 dark:border-white/10 dark:bg-slate-900/70"
          />
        </div>
        {filters ? <div className="flex flex-wrap gap-2">{filters}</div> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[var(--brand-line)] bg-[var(--surface-soft)] px-6 py-10 text-center dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.7),rgba(2,6,23,0.68))]">
      <p className="font-heading text-[2.35rem] text-slate-900 dark:text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-[1.06rem] leading-8 text-slate-600 dark:text-slate-300">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-6 py-6 dark:border-rose-500/30 dark:bg-rose-950/30">
      <p className="font-heading text-[2.2rem] text-rose-900 dark:text-rose-200">{title}</p>
      <p className="mt-2 text-[1.04rem] text-rose-700 dark:text-rose-200/85">{error}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCcw className="size-4" />
          دوبارہ کوشش کریں
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ title = "صفحہ کھل رہا ہے" }: { title?: string }) {
  return <CenterLoader title={title} subtitle="API response aur page content تیار ہو رہا ہے" />;
}

export function ActionButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>
      <Plus className="size-4" />
      {children}
    </Button>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "تصدیق کریں",
  tone = "default",
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:border-white/10 dark:bg-slate-950/95">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl dark:text-white">{title}</DialogTitle>
          <DialogDescription className="leading-7 dark:text-slate-300">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-row-reverse justify-start">
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            واپس
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DataList<T>({
  data,
  columns,
  renderCard,
  getKey,
}: {
  data: T[];
  columns: Array<{ key: string; title: string; render: (item: T) => React.ReactNode; className?: string }>;
  renderCard: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
}) {
  if (!data.length) return null;

  return (
    <>
      <div className="hidden overflow-hidden rounded-[1.5rem] border border-[var(--brand-line)] bg-white/70 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950/45 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-base">
            <thead className="bg-[var(--surface-soft)] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                {columns.map((column) => (
                    <th key={column.key} className={cn("px-4 py-3.5 text-right font-medium", column.className)}>
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--brand-line)] bg-white dark:divide-white/10 dark:bg-slate-950/70">
              {data.map((item) => (
                <tr key={getKey(item)} className="align-top hover:bg-[var(--surface-soft)]/60 dark:hover:bg-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-4.5", column.className)}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {data.map((item) => (
          <div key={getKey(item)}>{renderCard(item)}</div>
        ))}
      </div>
    </>
  );
}

export function MetaStat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-line)] bg-[var(--surface-soft)] px-4 py-3 dark:border-white/10 dark:bg-slate-900/60">
      <p className="text-[1.08rem] text-slate-500 dark:text-slate-300">{title}</p>
      <p className="mt-1 font-heading text-[2.2rem] text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
      <Printer className="size-4" />
      پرنٹ
    </Button>
  );
}

export function PdfDownloadButton({
  onClick,
  loading = false,
  label = "پی ڈی ایف",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      className="print:hidden"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {label}
    </Button>
  );
}

export function ReportPrintButton({
  onClick,
  loading = false,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Button variant="outline" className="print:hidden" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
      پرنٹ
    </Button>
  );
}

export function AmountText({
  value,
  tone,
}: {
  value: number;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "font-semibold",
        tone === "success" && "text-emerald-700",
        tone === "warning" && "text-amber-700",
        (!tone || tone === "neutral") && "text-slate-900 dark:text-white",
      )}
    >
      {formatCurrency(value)}
    </span>
  );
}
