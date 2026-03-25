"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CircleDollarSign,
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
import { useQuery } from "@tanstack/react-query";
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

  const visibleLinks = sidebarLinks.filter((item) =>
    item.roles.includes((user?.role ?? "OPERATOR") as UserRole),
  );

  const pageTitle = useMemo(() => {
    const current =
      visibleLinks.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ??
      sidebarLinks.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));
    return current?.title ?? "منڈی اسمارٹ";
  }, [pathname, visibleLinks]);

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
          "fixed inset-y-0 right-0 z-50 flex h-screen w-[22rem] flex-col overflow-hidden border-l border-white/50 bg-[linear-gradient(180deg,rgba(9,61,47,0.98),rgba(15,23,42,0.98))] px-4 py-5 shadow-[0_30px_80px_-35px_rgba(2,8,23,0.8)] transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full",
          "lg:w-[21rem]",
        )}
      >
        <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))] p-4 text-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-[1.9rem] leading-none">{appName}</p>
              <p className="mt-2 text-sm text-white/75">
                {tenantQuery.data?.name ?? "منڈی کا حساب"}
              </p>
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2.5">
              <p className="text-xs text-white/60">رول</p>
              <p className="mt-1 text-base font-semibold text-white">
                {user?.role === "OWNER" ? "مالک" : "مشی"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2.5">
              <p className="text-xs text-white/60">شناخت</p>
              <p className="mt-1 truncate text-base font-semibold text-white">
                {tenantQuery.data?.slug ?? "..."}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="mt-6 min-h-0 flex-1">
          <div className="space-y-6 pl-1">
            {sidebarGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-white/50">
                  {group.title}
                </p>
                <nav className="space-y-1.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = sidebarIconMap[item.href];

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center justify-between rounded-[1.35rem] border px-3 py-3 transition duration-200",
                          active
                            ? "border-white/70 bg-[linear-gradient(135deg,#fffefb,#f5ead6)] text-[var(--brand-forest)] shadow-[0_16px_35px_-25px_rgba(15,23,42,0.8)]"
                            : "border-transparent bg-white/[0.04] text-white/82 hover:border-white/10 hover:bg-white/[0.09] hover:text-white",
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-2xl border transition",
                              active
                                ? "border-[var(--brand-sand)]/60 bg-[var(--surface-warm)] text-[var(--brand-forest)]"
                                : "border-white/10 bg-white/6 text-white/78 group-hover:bg-white/10 group-hover:text-white",
                            )}
                          >
                            {Icon ? <Icon className="size-5" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className={cn("block truncate text-[1.24rem] leading-7", active ? "font-heading" : "font-medium")}>
                              {item.title}
                            </span>
                            <span className={cn("block text-xs", active ? "text-[var(--brand-forest)]/70" : "text-white/45")}>
                              {active ? "یہ صفحہ کھلا ہوا ہے" : "کھولنے کے لئے دبائیں"}
                            </span>
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 shrink-0 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-3">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-white/6 px-3 py-2.5 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm text-white/60">کام کرنے والا</p>
              <p className="truncate text-base font-semibold text-white">{user?.name ?? "..."}</p>
            </div>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/75">
              {user?.role === "OWNER" ? "مالک" : "مشی"}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white transition hover:bg-white/12"
          >
            <LogOut className="size-4" />
            لاگ آؤٹ
          </button>
        </div>
      </aside>

      <div className="lg:pr-[21rem]">
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
              <div>
                <p className="font-heading text-2xl text-slate-900 dark:text-white">{pageTitle}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {tenantQuery.data?.name ?? "کھل رہا ہے"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="rounded-3xl border border-[var(--brand-sand)] bg-[linear-gradient(180deg,#fffaf1,#f8efde)] px-4 py-2 text-right shadow-sm dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.05))]">
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.role === "OWNER" ? "مالک" : "مشی"}</p>
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
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,241,0.92))] p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.78))] lg:flex-row lg:items-center lg:justify-between lg:p-7">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl text-slate-950 dark:text-white lg:text-4xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p> : null}
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
            "overflow-hidden border-0 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.55)]",
            item.tone === "warm" && "bg-[linear-gradient(135deg,#fff8ec,#fff1d8)] dark:bg-[linear-gradient(135deg,rgba(96,66,22,0.4),rgba(49,34,12,0.55))]",
            item.tone === "success" && "bg-[linear-gradient(135deg,#eefcf6,#ddf6eb)] dark:bg-[linear-gradient(135deg,rgba(8,80,54,0.55),rgba(8,48,35,0.62))]",
            item.tone === "danger" && "bg-[linear-gradient(135deg,#fff4f2,#ffe4df)] dark:bg-[linear-gradient(135deg,rgba(108,32,32,0.52),rgba(58,20,20,0.65))]",
            (!item.tone || item.tone === "default") && "bg-white dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.86))]",
            "dark:border dark:border-white/10",
          )}
        >
          <CardHeader className="gap-3">
            <CardDescription className="dark:text-slate-300">{item.title}</CardDescription>
            <CardTitle className="font-heading text-3xl dark:text-white">{item.value}</CardTitle>
          </CardHeader>
          {item.help ? (
            <CardContent className="pt-0 text-sm text-slate-600 dark:text-slate-300">{item.help}</CardContent>
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
    <Card className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,238,0.95))] shadow-[0_20px_60px_-42px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.78))]">
      <CardHeader className="flex flex-col gap-3 border-b border-[var(--brand-line)] dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="font-heading text-2xl dark:text-white">{title}</CardTitle>
          {description ? <CardDescription className="dark:text-slate-300">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
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
    <Badge variant="outline" className={cn("rounded-full border px-3 py-1 text-xs", className)}>
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
      <p className="font-heading text-2xl text-slate-900 dark:text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
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
      <p className="font-heading text-2xl text-rose-900 dark:text-rose-200">{title}</p>
      <p className="mt-2 text-sm text-rose-700 dark:text-rose-200/85">{error}</p>
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
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.75rem] border border-white/70 bg-white dark:border-white/10 dark:bg-slate-950/70">
      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
        <Loader2 className="size-5 animate-spin" />
        {title}
      </div>
    </div>
  );
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
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-[var(--surface-soft)] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={cn("px-4 py-3 text-right font-medium", column.className)}>
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--brand-line)] bg-white dark:divide-white/10 dark:bg-slate-950/70">
              {data.map((item) => (
                <tr key={getKey(item)} className="align-top hover:bg-[var(--surface-soft)]/60 dark:hover:bg-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-4", column.className)}>
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
      <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p>
      <p className="mt-1 font-heading text-2xl text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" />
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
