"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  CircleDollarSign,
  HandCoins,
  PackageSearch,
  ReceiptText,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import {
  authApi,
  consignmentsApi,
  customersApi,
  expensesApi,
  paymentsApi,
  reportsApi,
  salesApi,
  suppliersApi,
  tenantApi,
  usersApi,
} from "@/lib/mandi/api";
import {
  commissionTypeLabels,
  consignmentStatusLabels,
  expenseTypeLabels,
  paymentMethodLabels,
  reportLinks,
  roleLabels,
} from "@/lib/mandi/constants";
import {
  createConsignmentSummaryPdf,
  createCustomerLedgerPdf,
  createDailySalesPdf,
  createSupplierSettlementPdf,
  downloadPdfBlob,
  openPdfBlob,
} from "@/lib/mandi/report-pdf";
import type {
  Consignment,
  ConsignmentSummaryReport,
  Customer,
  CustomerLedgerReport,
  DailySalesReport,
  Expense,
  Payment,
  Sale,
  Supplier,
  SupplierSettlementReport,
  Tenant,
  User,
} from "@/lib/mandi/types";
import {
  calculateBalance,
  formatCurrency,
  formatDate,
  formatNumber,
  getBalanceLabel,
  getBalanceTone,
  todayDate,
} from "@/lib/mandi/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ActionButton,
  AmountText,
  ConfirmDialog,
  DataList,
  EmptyState,
  ErrorState,
  LoadingState,
  MetaStat,
  PageHeader,
  PdfDownloadButton,
  ReportPrintButton,
  RoleGuard,
  SearchToolbar,
  SectionCard,
  StatusPill,
  SummaryCards,
  useSession,
} from "@/components/mandi/ui";
import {
  ConsignmentDialog,
  CustomerDialog,
  ExpenseDialog,
  PaymentDialog,
  SaleDialog,
  SupplierDialog,
  UserDialog,
} from "@/components/mandi/forms";
import { sessionStore } from "@/lib/mandi/session";
import { cn } from "@/lib/utils";

type MutationMode = "create" | "update";

function useCrudActions<T extends { id: string }>(
  key: string,
  createFn: (payload: Partial<T>) => Promise<unknown>,
  updateFn: (id: string, payload: Partial<T>) => Promise<unknown>,
  deleteFn: (id: string) => Promise<unknown>,
  options?: {
    onSaveSuccess?: () => void;
    onDeleteSuccess?: () => void;
  },
) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async ({ mode, values, id }: { mode: MutationMode; values: Partial<T>; id?: string }) => {
      if (mode === "update" && id) {
        return updateFn(id, values);
      }
      return createFn(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      options?.onSaveSuccess?.();
      toast.success("کامیابی سے محفوظ ہو گیا");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      options?.onDeleteSuccess?.();
      toast.success("مٹا دیا گیا");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { saveMutation, deleteMutation };
}

function getCustomerOptionLabel(customer: Customer) {
  return customer.phone ? `${customer.name} - ${customer.phone}` : customer.name;
}

export function LoginPageClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      if (form.rememberMe) {
        sessionStore.setRememberedLogin({
          tenantSlug: form.tenantSlug,
          email: form.email,
          password: form.password,
        }, true);
      } else {
        sessionStore.clearRememberedLogin();
      }
      sessionStore.setSession(data, { remember: form.rememberMe });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("آپ آ گئے ہیں");
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [form, setForm] = useState({
    tenantSlug: "",
    email: "",
    password: "",
    rememberMe: true,
  });

  useEffect(() => {
    const savedLogin = sessionStore.getRememberedLogin();
    const rememberMe = sessionStore.getRememberPreference();

    if (!savedLogin) {
      setForm((prev) => ({ ...prev, rememberMe }));
      return;
    }

    setForm({
      tenantSlug: savedLogin.tenantSlug ?? "",
      email: savedLogin.email ?? "",
      password: savedLogin.password ?? "",
      rememberMe,
    });
  }, []);

  return (
    <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-slate-950/80 lg:p-8">
      <div className="space-y-3">
        <p className="font-heading text-4xl text-slate-950 dark:text-white">منڈی اسمارٹ</p>
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">اپنے کاروبار میں داخل ہوں</h1>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          منڈی کی روزانہ فروخت، وصولی، خرچے اور کھاتہ ایک جگہ سنبھالیں۔
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(form);
        }}
      >
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">کاروبار کا شناختی نام</label>
            <Input
              value={form.tenantSlug}
              onChange={(event) => setForm((prev) => ({ ...prev, tenantSlug: event.target.value }))}
              placeholder="جس نام سے آپ لاگ اِن کرتے ہیں"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">ای میل</label>
            <Input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="مالک یا مشی کی ای میل"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">پاس ورڈ</label>
            <PasswordInput
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="پاس ورڈ"
              dir="ltr"
              required
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--brand-line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          <span>
            مجھے یاد رکھیں
          </span>
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(event) => setForm((prev) => ({ ...prev, rememberMe: event.target.checked }))}
            className="size-4 accent-[var(--brand-forest)]"
          />
        </label>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "انتظار کریں..." : "لاگ اِن کریں"}
        </Button>
      </form>
    </div>
  );
}

function filterActive(value: string) {
  if (value === "all") return undefined;
  return value === "true";
}

function RecordActions({
  onEdit,
  onDelete,
  detailHref,
}: {
  onEdit: () => void;
  onDelete: () => void;
  detailHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {detailHref ? (
        <Button variant="outline" asChild>
          <Link href={detailHref}>مزید دیکھیں</Link>
        </Button>
      ) : null}
      <Button variant="outline" onClick={onEdit}>
        بدلیں
      </Button>
      <Button variant="ghost" className="text-rose-700" onClick={onDelete}>
        مٹائیں
      </Button>
    </div>
  );
}

export function DashboardPageClient() {
  const session = useSession();
  const results = useQueries({
    queries: [
      { queryKey: ["sales", "dashboard"], queryFn: () => salesApi.list({ limit: 8 }) },
      { queryKey: ["payments", "dashboard"], queryFn: () => paymentsApi.list({ limit: 6 }) },
      { queryKey: ["expenses", "dashboard"], queryFn: () => expensesApi.list({ limit: 6 }) },
      { queryKey: ["customers", "dashboard"], queryFn: () => customersApi.list({ limit: 100 }) },
      { queryKey: ["consignments", "dashboard"], queryFn: () => consignmentsApi.list({ limit: 100, status: "OPEN" }) },
    ],
  });

  const [salesQuery, paymentsQuery, expensesQuery, customersQuery, consignmentsQuery] = results;

  if (results.some((query) => query.isLoading)) {
    return <LoadingState title="ڈیش بورڈ تیار ہو رہا ہے" />;
  }

  if (results.some((query) => query.isError)) {
    const error = results.find((query) => query.error)?.error as Error;
    return <ErrorState title="ڈیش بورڈ لوڈ نہیں ہو سکا" error={error.message} />;
  }

  const sales = salesQuery.data?.items ?? [];
  const payments = paymentsQuery.data?.items ?? [];
  const expenses = expensesQuery.data?.items ?? [];
  const customers = customersQuery.data?.items ?? [];
  const openConsignments = consignmentsQuery.data?.items ?? [];
  const today = todayDate();
  const todaySales = sales.filter((sale) => sale.saleDate?.slice(0, 10) === today);
  const customerBalances = customers.map((customer) => calculateBalance(customer));
  const outstanding = customerBalances.filter((balance) => balance > 0).reduce((sum, value) => sum + value, 0);
  const advance = customerBalances.filter((balance) => balance < 0).reduce((sum, value) => sum + Math.abs(value), 0);
  const recentSales = sales.slice(0, 4);
  const topOutstandingCustomers = customers
    .slice()
    .sort((a, b) => calculateBalance(b) - calculateBalance(a))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="آج کی منڈی کی صورت حال"
        description="یہ ڈیش بورڈ مالک اور مشی دونوں کو روزانہ کی فروخت، کھلی گاڑیاں، حالیہ وصولیوں اور خرچوں کا فوری خلاصہ دیتا ہے۔"
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/payments">نئی وصولی</Link>
            </Button>
            {session?.role === "OWNER" ? (
              <Button variant="outline" asChild>
                <Link href="/reports">رپورٹس</Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/sales">
                <CircleDollarSign className="size-4" />
                نئی فروخت
              </Link>
            </Button>
          </div>
        }
      />

      <SummaryCards
        items={[
          {
            title: "آج کی فروخت",
            value: formatCurrency(todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0)),
            help: `${todaySales.length || 0} اندراج`,
            tone: "success",
          },
          {
            title: "واجب الادا",
            value: formatCurrency(outstanding),
            help: "گاہکوں سے قابل وصول رقم",
            tone: "warm",
          },
          {
            title: "آج کی وصولی",
            value: formatCurrency(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)),
            help: "آج درج شدہ ادائیگیاں",
            tone: "default",
          },
          {
            title: "آج کے خرچے",
            value: formatCurrency(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)),
            help: `${openConsignments.length} کھلی گاڑیاں`,
            tone: "danger",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
        <SectionCard title="گاہک کھاتہ" description="نمایاں واجبات اور ایڈوانس ایک نظر میں">
          <div className="space-y-3">
            {topOutstandingCustomers.length ? (
              topOutstandingCustomers.map((customer) => {
                const balance = calculateBalance(customer);
                return (
                  <div key={customer.id} className="flex items-center justify-between border-b border-[var(--brand-line)] pb-4 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-heading text-[1.9rem] text-slate-950 dark:text-white">{customer.name}</p>
                      <p className={cn(
                        "mt-1 inline-flex rounded-full border px-3 py-1 text-sm",
                        getBalanceTone(balance),
                      )}>
                        {getBalanceLabel(balance)}
                      </p>
                    </div>
                    <p className={cn(
                      "font-heading text-[1.9rem]",
                      balance < 0 ? "text-[var(--brand-forest)]" : "text-[#c7951d]",
                    )}>
                      {formatCurrency(Math.abs(balance))}
                    </p>
                  </div>
                );
              })
            ) : (
              <EmptyState title="گاہک موجود نہیں" description="گاہک بننے کے بعد یہاں ان کا کھاتہ نظر آئے گا۔" />
            )}
            <Button variant="outline" asChild className="mt-2 w-full">
              <Link href="/customers">تمام گاہک دیکھیں</Link>
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="حالیہ فروخت" description="تازہ اندراجات">
          {recentSales.length ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--brand-line)] bg-[var(--surface-soft)]">
              <div className="grid grid-cols-4 border-b border-[var(--brand-line)] bg-[#f4efe6] px-5 py-3 text-[1.05rem] text-slate-700">
                <p>تاریخ</p>
                <p>گاہک</p>
                <p>رقم</p>
                <p>حالت</p>
              </div>
              {recentSales.map((sale) => (
                <div key={sale.id} className="grid grid-cols-4 items-center border-b border-[var(--brand-line)] px-5 py-4 last:border-b-0">
                  <p className="text-[1.05rem] text-slate-600 dark:text-slate-300">{formatDate(sale.saleDate)}</p>
                  <p className="font-heading text-[1.8rem] text-slate-950 dark:text-white">{sale.customer?.name ?? "گاہک"}</p>
                  <p className="font-heading text-[1.7rem] text-[var(--brand-forest)]">{formatCurrency(sale.totalAmount)}</p>
                  <span className="inline-flex w-fit rounded-full border border-[#b9d1e2] bg-[#edf5fb] px-3 py-1 text-sm text-[#4d80a8]">
                    مکمل
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="ابھی فروخت نہیں" description="جیسے ہی نئی فروخت درج ہوگی، یہاں نظر آئے گی۔" />
          )}
        </SectionCard>
      </div>

      <SectionCard title="تیز کام" description="روزانہ آپریشن کے زیادہ استعمال ہونے والے راستے">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/consignments", icon: Truck, title: "نئی گاڑی", text: "سپلائر کا ٹرک وصول کریں" },
            { href: "/sales", icon: CircleDollarSign, title: "نئی فروخت", text: "گاہک کو مال جاری کریں" },
            { href: "/payments", icon: HandCoins, title: "نئی وصولی", text: "گاہک کی ادائیگی درج کریں" },
            { href: "/expenses", icon: ReceiptText, title: "نیا خرچہ", text: "منڈی خرچہ درج کریں" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[1.35rem] border border-[var(--brand-line)] bg-[#fffdf8] p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f3ece0] text-[var(--brand-forest)]">
                <item.icon className="size-6" />
              </span>
              <p className="mt-4 font-heading text-[1.8rem] text-slate-950 dark:text-white">{item.title}</p>
              <p className="mt-2 text-[1.02rem] leading-8 text-slate-600 dark:text-slate-300">{item.text}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function CustomersPageClient() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["customers", search, active],
    queryFn: () => customersApi.list({ search, isActive: filterActive(active), limit: 100 }),
  });

  const { saveMutation, deleteMutation } = useCrudActions<Customer>(
    "customers",
    customersApi.create,
    customersApi.update,
    customersApi.remove,
    {
      onSaveSuccess: () => {
        setOpen(false);
        setEditing(null);
      },
    },
  );

  const items = query.data?.items ?? [];
  const balances = items.map((customer) => calculateBalance(customer));

  return (
    <div className="space-y-6">
      <PageHeader
        title="گاہک"
        description="گاہکوں کی فہرست، ان کے واجبات، ایڈوانس اور کھاتہ تک رسائی ایک ہی جگہ۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نیا گاہک</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل گاہک", value: formatNumber(items.length) },
          { title: "واجب الادا", value: formatCurrency(balances.filter((value) => value > 0).reduce((a, b) => a + b, 0)), tone: "danger" },
          { title: "ایڈوانس", value: formatCurrency(balances.filter((value) => value < 0).reduce((a, b) => a + Math.abs(b), 0)), tone: "success" },
          { title: "غیر فعال", value: formatNumber(items.filter((item) => !item.isActive).length), tone: "warm" },
        ]}
      />

      <SectionCard title="فہرست" description="گاہک تلاش کریں، حالت کے مطابق فلٹر کریں، یا تفصیل دیکھیں۔">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          filters={
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger className="w-full min-w-40 bg-white dark:bg-slate-900/70 dark:border-white/10">
                <SelectValue placeholder="حالت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">سب</SelectItem>
                <SelectItem value="true">فعال</SelectItem>
                <SelectItem value="false">غیر فعال</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <div className="mt-5">
          {query.isLoading ? <LoadingState title="گاہک لوڈ ہو رہے ہیں" /> : null}
          {query.isError ? <ErrorState title="گاہک لوڈ نہیں ہو سکے" error={(query.error as Error).message} onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && !items.length ? (
            <EmptyState title="کوئی گاہک نہیں ملا" description="نیا گاہک شامل کریں یا تلاش بدل کر دیکھیں۔" />
          ) : null}
          {!query.isLoading && !query.isError && items.length ? (
            <DataList
              data={items}
              getKey={(customer) => customer.id}
              columns={[
                { key: "name", title: "گاہک", render: (customer) => <div><p className="font-semibold dark:text-white">{customer.name}</p><p className="text-xs text-slate-500 dark:text-slate-300">{customer.phone || "فون موجود نہیں"}</p></div> },
                { key: "address", title: "پتہ", render: (customer) => customer.address || "..." },
                { key: "balance", title: "بیلنس", render: (customer) => {
                    const balance = calculateBalance(customer);
                    return <div className={`inline-flex rounded-full border px-3 py-1 ${getBalanceTone(balance)}`}>{getBalanceLabel(balance)} - {formatCurrency(Math.abs(balance))}</div>;
                  } },
                { key: "status", title: "حالت", render: (customer) => <StatusPill label={customer.isActive ? "فعال" : "غیر فعال"} tone={customer.isActive ? "success" : "warning"} /> },
                { key: "actions", title: "عمل", render: (customer) => <RecordActions detailHref={`/customers/${customer.id}`} onEdit={() => { setEditing(customer); setOpen(true); }} onDelete={() => setDeleting(customer)} /> },
              ]}
              renderCard={(customer) => {
                const balance = calculateBalance(customer);
                return (
                  <Card className="border-[var(--brand-line)] bg-white p-0 dark:border-white/10 dark:bg-slate-950/70">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-2xl">{customer.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-300">{customer.phone || "فون موجود نہیں"}</p>
                        </div>
                        <StatusPill label={customer.isActive ? "فعال" : "غیر فعال"} tone={customer.isActive ? "success" : "warning"} />
                      </div>
                      <div className={`rounded-2xl border px-4 py-3 ${getBalanceTone(balance)}`}>
                        {getBalanceLabel(balance)}: {formatCurrency(Math.abs(balance))}
                      </div>
                      <RecordActions detailHref={`/customers/${customer.id}`} onEdit={() => { setEditing(customer); setOpen(true); }} onDelete={() => setDeleting(customer)} />
                    </CardContent>
                  </Card>
                );
              }}
            />
          ) : null}
        </div>
      </SectionCard>

      <CustomerDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={editing}
        loading={saveMutation.isPending}
        onSubmit={(values) =>
          saveMutation.mutate({
            mode: editing ? "update" : "create",
            id: editing?.id,
            values,
          })
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="گاہک حذف کریں؟"
        description="یہ عمل واپس نہیں ہو سکے گا اور متعلقہ ریکارڈز پر اثر ڈال سکتا ہے۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function CustomerDetailPageClient({ id }: { id: string }) {
  const customerQuery = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.get(id),
  });
  const ledgerQuery = useQuery({
    queryKey: ["reports", "customer-ledger", id],
    queryFn: () => reportsApi.customerLedger(id),
  });

  if (customerQuery.isLoading || ledgerQuery.isLoading) {
    return <LoadingState title="گاہک کی تفصیل لوڈ ہو رہی ہے" />;
  }

  if (customerQuery.isError || ledgerQuery.isError) {
    const error = (customerQuery.error || ledgerQuery.error) as Error;
    return <ErrorState title="گاہک کی تفصیل لوڈ نہیں ہو سکی" error={error.message} />;
  }

  if (!customerQuery.data || !ledgerQuery.data) {
    return <EmptyState title="گاہک کی تفصیل دستیاب نہیں" description="منتخب گاہک کا مکمل ریکارڈ نہیں ملا۔" />;
  }

  const customer = customerQuery.data;
  const report = ledgerQuery.data;
  const balance = report?.balance ?? calculateBalance(customer);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description="گاہک کی بنیادی معلومات، چلتا کھاتہ، فروخت اور وصولی کی تاریخ۔"
        action={
          <Button variant="outline" asChild>
            <Link href="/customers">
              <ArrowLeft className="size-4" />
              فہرست پر واپس
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="بنیادی معلومات" description="گاہک پروفائل">
          <div className="grid gap-3">
            <MetaStat title="فون" value={customer.phone || "موجود نہیں"} />
            <MetaStat title="پتہ" value={customer.address || "موجود نہیں"} />
            <MetaStat title="حالت" value={customer.isActive ? "فعال" : "غیر فعال"} />
            <div className={`rounded-[1.5rem] border px-4 py-4 ${getBalanceTone(balance)}`}>
              <p className="text-sm">{getBalanceLabel(balance)}</p>
              <p className="font-heading text-3xl">{formatCurrency(Math.abs(balance))}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="کھاتہ" description="فروخت = ڈیبٹ، وصولی = کریڈٹ، اور ساتھ چلتا بیلنس">
          {report?.entries?.length ? (
            <DataList
              data={report.entries}
              getKey={(entry) => entry.id}
              columns={[
                { key: "date", title: "تاریخ", render: (entry) => formatDate(entry.date) },
                { key: "type", title: "قسم", render: (entry) => <StatusPill label={entry.type === "SALE" ? "فروخت" : "وصولی"} tone={entry.type === "SALE" ? "warning" : "success"} /> },
                { key: "desc", title: "تفصیل", render: (entry) => entry.description },
                { key: "debit", title: "ڈیبٹ", render: (entry) => formatCurrency(entry.debit) },
                { key: "credit", title: "کریڈٹ", render: (entry) => formatCurrency(entry.credit) },
                { key: "balance", title: "چلتا بیلنس", render: (entry) => {
                    const tone = entry.balance > 0 ? "warning" : entry.balance < 0 ? "success" : "default";
                    return <StatusPill label={`${getBalanceLabel(entry.balance)} - ${formatCurrency(Math.abs(entry.balance))}`} tone={tone === "default" ? "default" : tone} />;
                  } },
              ]}
              renderCard={(entry) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <StatusPill label={entry.type === "SALE" ? "فروخت" : "وصولی"} tone={entry.type === "SALE" ? "warning" : "success"} />
                      <p className="text-sm text-slate-500 dark:text-slate-300">{formatDate(entry.date)}</p>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">{entry.description}</p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div><p className="text-slate-500 dark:text-slate-300">ڈیبٹ</p><p className="dark:text-white">{formatCurrency(entry.debit)}</p></div>
                      <div><p className="text-slate-500 dark:text-slate-300">کریڈٹ</p><p className="dark:text-white">{formatCurrency(entry.credit)}</p></div>
                      <div><p className="text-slate-500 dark:text-slate-300">بیلنس</p><p className="dark:text-white">{formatCurrency(Math.abs(entry.balance))}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          ) : (
            <EmptyState title="کھاتہ خالی ہے" description="ابھی اس گاہک کے نام پر کوئی فروخت یا وصولی درج نہیں ہوئی۔" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function SuppliersPageClient() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => suppliersApi.list({ search, limit: 100 }),
  });
  const consignmentsQuery = useQuery({
    queryKey: ["consignments", "supplier-summary"],
    queryFn: () => consignmentsApi.list({ limit: 100 }),
  });
  const { saveMutation, deleteMutation } = useCrudActions<Supplier>(
    "suppliers",
    suppliersApi.create,
    suppliersApi.update,
    suppliersApi.remove,
    {
      onSaveSuccess: () => {
        setOpen(false);
        setEditing(null);
      },
    },
  );

  const items = query.data?.items ?? [];
  const consignments = consignmentsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="سپلائر"
        description="کسان یا سپلائر کی فہرست، ان کی گاڑیاں، اور حساب تک رسائی۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نیا سپلائر</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل سپلائر", value: formatNumber(items.length) },
          { title: "کل گاڑیاں", value: formatNumber(consignments.length), tone: "warm" },
          { title: "کھلی گاڑیاں", value: formatNumber(consignments.filter((item) => item.status === "OPEN").length), tone: "default" },
          { title: "غیر فعال سپلائر", value: formatNumber(items.filter((item) => !item.isActive).length), tone: "danger" },
        ]}
      />

      <SectionCard title="فہرست" description="سپلائر تلاش کریں اور ان کی مزید معلومات یا حساب تک پہنچیں۔">
        <SearchToolbar search={search} onSearchChange={setSearch} />
        <div className="mt-5">
          {query.isLoading ? <LoadingState title="سپلائر لوڈ ہو رہے ہیں" /> : null}
          {query.isError ? <ErrorState title="سپلائر لوڈ نہیں ہو سکے" error={(query.error as Error).message} onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && !items.length ? (
            <EmptyState title="سپلائر موجود نہیں" description="نیا سپلائر شامل کریں تاکہ اس کی گاڑی درج کی جا سکے۔" />
          ) : null}
          {!query.isLoading && !query.isError && items.length ? (
            <DataList
              data={items}
              getKey={(supplier) => supplier.id}
              columns={[
                { key: "name", title: "سپلائر", render: (supplier) => <div><p className="font-semibold dark:text-white">{supplier.name}</p><p className="text-xs text-slate-500 dark:text-slate-300">{supplier.phone || "فون موجود نہیں"}</p></div> },
                { key: "address", title: "پتہ", render: (supplier) => supplier.address || "..." },
                { key: "consignments", title: "گاڑیاں", render: (supplier) => formatNumber(consignments.filter((item) => item.supplierId === supplier.id).length) },
                { key: "status", title: "حالت", render: (supplier) => <StatusPill label={supplier.isActive ? "فعال" : "غیر فعال"} tone={supplier.isActive ? "success" : "warning"} /> },
                { key: "actions", title: "عمل", render: (supplier) => <RecordActions detailHref={`/suppliers/${supplier.id}`} onEdit={() => { setEditing(supplier); setOpen(true); }} onDelete={() => setDeleting(supplier)} /> },
              ]}
              renderCard={(supplier) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-2xl">{supplier.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{supplier.phone || "فون موجود نہیں"}</p>
                      </div>
                      <StatusPill label={supplier.isActive ? "فعال" : "غیر فعال"} tone={supplier.isActive ? "success" : "warning"} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{supplier.address || "پتہ موجود نہیں"}</p>
                    <RecordActions detailHref={`/suppliers/${supplier.id}`} onEdit={() => { setEditing(supplier); setOpen(true); }} onDelete={() => setDeleting(supplier)} />
                  </CardContent>
                </Card>
              )}
            />
          ) : null}
        </div>
      </SectionCard>

      <SupplierDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={editing}
        loading={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutate({ mode: editing ? "update" : "create", id: editing?.id, values })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="سپلائر حذف کریں؟"
        description="اگر اس سپلائر کے ساتھ گاڑیاں یا مال جڑا ہوا ہے تو بیک اینڈ یہ عمل روک سکتا ہے۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function SupplierDetailPageClient({ id }: { id: string }) {
  const supplierQuery = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => suppliersApi.get(id),
  });
  const consignmentsQuery = useQuery({
    queryKey: ["consignments", "supplier", id],
    queryFn: () => consignmentsApi.list({ supplierId: id, limit: 100 }),
  });

  if (supplierQuery.isLoading || consignmentsQuery.isLoading) {
    return <LoadingState title="سپلائر کی تفصیل لوڈ ہو رہی ہے" />;
  }

  if (supplierQuery.isError || consignmentsQuery.isError) {
    const error = (supplierQuery.error || consignmentsQuery.error) as Error;
    return <ErrorState title="سپلائر کی تفصیل نہیں مل سکی" error={error.message} />;
  }

  if (!supplierQuery.data) {
    return <EmptyState title="سپلائر نہیں ملا" description="ممکن ہے یہ ریکارڈ اب موجود نہ ہو۔" />;
  }

  const supplier = supplierQuery.data;
  const consignments = consignmentsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description="سپلائر پروفائل کے ساتھ منسلک گاڑیاں اور حساب تک تیز رسائی۔"
        action={
          <Button variant="outline" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="size-4" />
              فہرست پر واپس
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <SectionCard title="بنیادی معلومات" description="سپلائر ریکارڈ">
          <div className="grid gap-3">
            <MetaStat title="فون" value={supplier.phone || "موجود نہیں"} />
            <MetaStat title="پتہ" value={supplier.address || "موجود نہیں"} />
            <MetaStat title="کل گاڑیاں" value={formatNumber(consignments.length)} />
            <MetaStat title="کھلی گاڑیاں" value={formatNumber(consignments.filter((item) => item.status === "OPEN").length)} />
          </div>
        </SectionCard>

        <SectionCard title="منسلک گاڑیاں" description="سپلائر کے تمام درج شدہ ٹرک یا لوڈ">
          {consignments.length ? (
            <DataList
              data={consignments}
              getKey={(consignment) => consignment.id}
              columns={[
                { key: "vehicle", title: "گاڑی", render: (consignment) => consignment.vehicleNumber || "بغیر نمبر" },
                { key: "arrival", title: "آمد", render: (consignment) => formatDate(consignment.arrivalDate) },
                { key: "status", title: "حالت", render: (consignment) => <StatusPill label={consignmentStatusLabels[consignment.status]} tone={consignment.status === "OPEN" ? "warning" : "success"} /> },
                { key: "summary", title: "آئٹمز", render: (consignment) => formatNumber(consignment.items?.length ?? 0) },
                { key: "action", title: "عمل", render: (consignment) => (
                    <div className="flex gap-2">
                      <Button variant="outline" asChild><Link href={`/consignments/${consignment.id}`}>مزید دیکھیں</Link></Button>
                      <Button variant="outline" asChild><Link href={`/reports/supplier-settlement?consignmentId=${consignment.id}`}>حساب</Link></Button>
                    </div>
                  ) },
              ]}
              renderCard={(consignment) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-heading text-2xl">{consignment.vehicleNumber || "بغیر نمبر"}</p>
                      <StatusPill label={consignmentStatusLabels[consignment.status]} tone={consignment.status === "OPEN" ? "warning" : "success"} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{formatDate(consignment.arrivalDate)}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild><Link href={`/consignments/${consignment.id}`}>مزید دیکھیں</Link></Button>
                      <Button variant="outline" asChild><Link href={`/reports/supplier-settlement?consignmentId=${consignment.id}`}>حساب</Link></Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          ) : (
            <EmptyState title="گاڑی موجود نہیں" description="ابھی اس سپلائر کے نام پر کوئی گاڑی درج نہیں ہوئی۔" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function UsersPageClient() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.list({ search, limit: 100 }),
    enabled: session?.role === "OWNER",
  });
  const { saveMutation, deleteMutation } = useCrudActions<User>(
    "users",
    (payload) => usersApi.create(payload),
    (id, payload) => usersApi.update(id, payload),
    usersApi.remove,
    {
      onSaveSuccess: () => {
        setOpen(false);
        setEditing(null);
      },
    },
  );

  if (session?.role !== "OWNER") {
    return (
      <EmptyState
        title="یہ صفحہ صرف مالک کے لئے ہے"
        description="مشی صارفین آپریٹرز کی فہرست یا ان میں تبدیلی نہیں کر سکتے۔"
      />
    );
  }

  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="آپریٹرز"
        description="مالک یہاں سے نئے مشی شامل، ترمیم یا غیر فعال کر سکتا ہے۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نیا آپریٹر</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل صارف", value: formatNumber(items.length) },
          { title: "مشی", value: formatNumber(items.filter((item) => item.role === "OPERATOR").length), tone: "warm" },
          { title: "فعال", value: formatNumber(items.filter((item) => item.isActive).length), tone: "success" },
          { title: "غیر فعال", value: formatNumber(items.filter((item) => !item.isActive).length), tone: "danger" },
        ]}
      />

      <SectionCard title="صارف فہرست" description="رول، رابطہ اور حالت ایک نظر میں دیکھیں۔">
        <SearchToolbar search={search} onSearchChange={setSearch} />
        <div className="mt-5">
          {query.isLoading ? <LoadingState title="صارف لوڈ ہو رہے ہیں" /> : null}
          {query.isError ? <ErrorState title="صارف لوڈ نہیں ہو سکے" error={(query.error as Error).message} onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && !items.length ? (
            <EmptyState title="کوئی صارف نہیں ملا" description="نیا آپریٹر شامل کریں تاکہ روزانہ ڈیٹا انٹری دی جا سکے۔" />
          ) : null}
          {!query.isLoading && !query.isError && items.length ? (
            <DataList
              data={items}
              getKey={(user) => user.id}
              columns={[
                { key: "name", title: "صارف", render: (user) => <div><p className="font-semibold dark:text-white">{user.name}</p><p className="text-xs text-slate-500 dark:text-slate-300">{user.email}</p></div> },
                { key: "phone", title: "فون", render: (user) => user.phone || "..." },
                { key: "role", title: "رول", render: (user) => <StatusPill label={roleLabels[user.role]} tone={user.role === "OWNER" ? "default" : "warning"} /> },
                { key: "status", title: "حالت", render: (user) => <StatusPill label={user.isActive ? "فعال" : "غیر فعال"} tone={user.isActive ? "success" : "warning"} /> },
                { key: "actions", title: "عمل", render: (user) => <RecordActions onEdit={() => { setEditing(user); setOpen(true); }} onDelete={() => setDeleting(user)} /> },
              ]}
              renderCard={(user) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading text-2xl">{user.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{user.email}</p>
                      </div>
                      <StatusPill label={roleLabels[user.role]} tone={user.role === "OWNER" ? "default" : "warning"} />
                    </div>
                    <RecordActions onEdit={() => { setEditing(user); setOpen(true); }} onDelete={() => setDeleting(user)} />
                  </CardContent>
                </Card>
              )}
            />
          ) : null}
        </div>
      </SectionCard>

      <UserDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={editing}
        loading={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutate({ mode: editing ? "update" : "create", id: editing?.id, values })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="صارف حذف کریں؟"
        description="یہ عمل صرف تب کریں جب آپ کو یقین ہو کہ اس صارف کی مزید ضرورت نہیں۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function SettingsPageClient() {
  const session = useSession();
  const tenantQuery = useQuery({
    queryKey: ["tenant", "settings"],
    queryFn: tenantApi.me,
  });
  const mutation = useMutation({
    mutationFn: tenantApi.update,
    onSuccess: () => {
      tenantQuery.refetch();
      toast.success("سیٹنگز محفوظ ہو گئیں");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [form, setForm] = useState<Partial<Tenant>>({});

  const tenant = tenantQuery.data;
  const values = {
    name: form.name ?? tenant?.name ?? "",
    slug: tenant?.slug ?? "",
    phone: form.phone ?? tenant?.phone ?? "",
    address: form.address ?? tenant?.address ?? "",
    locale: form.locale ?? tenant?.locale ?? "ur-PK",
    currency: form.currency ?? tenant?.currency ?? "PKR",
    isActive: form.isActive ?? tenant?.isActive ?? true,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="سیٹنگز"
        description="کاروبار کی بنیادی معلومات، رابطہ، کرنسی اور مقامی ترجیحات یہاں سنبھالیں۔"
      />

      {tenantQuery.isLoading ? <LoadingState title="سیٹنگز لوڈ ہو رہی ہیں" /> : null}
      {tenantQuery.isError ? <ErrorState title="سیٹنگز لوڈ نہیں ہو سکیں" error={(tenantQuery.error as Error).message} onRetry={() => tenantQuery.refetch()} /> : null}
      {tenant ? (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <SectionCard title="کاروباری خلاصہ" description="صرف مالک تبدیلی کر سکتا ہے">
            <div className="grid gap-3">
              <MetaStat title="کاروبار نام" value={tenant.name} />
              <MetaStat title="سلگ" value={tenant.slug} />
              <MetaStat title="رول" value={session?.role === "OWNER" ? "مالک" : "مشی"} />
            </div>
          </SectionCard>

          <SectionCard title="تفصیلات" description="یہ معلومات لاگ اِن کے بعد پورے سسٹم میں استعمال ہوگی">
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({
                  name: values.name,
                  phone: values.phone,
                  address: values.address,
                  locale: values.locale,
                  currency: values.currency,
                  isActive: values.isActive,
                });
              }}
            >
              <div>
                <label className="mb-2 block text-sm font-medium">کاروبار نام</label>
                <Input value={values.name} disabled={session?.role !== "OWNER"} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">فون</label>
                <Input value={values.phone ?? ""} disabled={session?.role !== "OWNER"} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">پتہ</label>
                <Input value={values.address ?? ""} disabled={session?.role !== "OWNER"} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">لوکیل</label>
                <Input value={values.locale ?? ""} disabled={session?.role !== "OWNER"} onChange={(event) => setForm((prev) => ({ ...prev, locale: event.target.value }))} dir="ltr" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">کرنسی</label>
                <Input value={values.currency ?? ""} disabled={session?.role !== "OWNER"} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))} dir="ltr" />
              </div>
              <div className="md:col-span-2">
                {session?.role === "OWNER" ? (
                  <Button type="submit" disabled={mutation.isPending}>
                    سیٹنگز محفوظ کریں
                  </Button>
                ) : (
                  <div className="rounded-2xl border border-[var(--brand-line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                    صرف مالک اس سیکشن میں تبدیلی کر سکتا ہے۔
                  </div>
                )}
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}

export function ConsignmentsPageClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Consignment | null>(null);
  const [deleting, setDeleting] = useState<Consignment | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["consignments", search, status],
    queryFn: () => consignmentsApi.list({ search, status: status === "all" ? undefined : status, limit: 100 }),
  });
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "options"],
    queryFn: () => suppliersApi.list({ limit: 100 }),
  });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async ({ values, id }: { values: Partial<Consignment>; id?: string }) => {
      if (id) return consignmentsApi.update(id, values);
      return consignmentsApi.create(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      setOpen(false);
      setEditing(null);
      toast.success("گاڑی محفوظ ہو گئی");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: consignmentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      toast.success("گاڑی مٹا دی گئی");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = query.data?.items ?? [];
  const suppliers = suppliersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="مال / گاڑی"
        description="سپلائر کا ٹرک، آئٹمز، کمیشن، حالت اور بند کرنے کا مکمل عملی ورک فلو۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نئی گاڑی</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل گاڑیاں", value: formatNumber(items.length) },
          { title: "کھلے", value: formatNumber(items.filter((item) => item.status === "OPEN").length), tone: "warm" },
          { title: "بند", value: formatNumber(items.filter((item) => item.status === "CLOSED").length), tone: "success" },
          { title: "کل آئٹمز", value: formatNumber(items.reduce((sum, item) => sum + (item.items?.length ?? 0), 0)), tone: "default" },
        ]}
      />

      <SectionCard title="فہرست" description="کھلی یا بند گاڑیاں فلٹر کریں اور تفصیل دیکھیں۔">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          filters={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full min-w-40 bg-white dark:bg-slate-900/70 dark:border-white/10">
                <SelectValue placeholder="حالت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">سب</SelectItem>
                <SelectItem value="OPEN">کھلے</SelectItem>
                <SelectItem value="CLOSED">بند</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <div className="mt-5">
          {query.isLoading ? <LoadingState title="گاڑیاں لوڈ ہو رہی ہیں" /> : null}
          {query.isError ? <ErrorState title="گاڑیاں لوڈ نہیں ہو سکیں" error={(query.error as Error).message} onRetry={() => query.refetch()} /> : null}
          {!query.isLoading && !query.isError && !items.length ? (
            <EmptyState title="کوئی گاڑی نہیں ملی" description="نئی گاڑی درج کر کے ٹرک وصولی شروع کریں۔" />
          ) : null}
          {!query.isLoading && !query.isError && items.length ? (
            <DataList
              data={items}
              getKey={(consignment) => consignment.id}
              columns={[
                { key: "supplier", title: "سپلائر", render: (consignment) => consignment.supplier?.name || "سپلائر" },
                { key: "vehicle", title: "گاڑی", render: (consignment) => consignment.vehicleNumber || "بغیر نمبر" },
                { key: "arrival", title: "آمد", render: (consignment) => formatDate(consignment.arrivalDate) },
                { key: "commission", title: "کمیشن", render: (consignment) => `${commissionTypeLabels[consignment.commissionType]} - ${formatNumber(consignment.commissionValue)}` },
                { key: "status", title: "حالت", render: (consignment) => <StatusPill label={consignmentStatusLabels[consignment.status]} tone={consignment.status === "OPEN" ? "warning" : "success"} /> },
                { key: "actions", title: "عمل", render: (consignment) => <RecordActions detailHref={`/consignments/${consignment.id}`} onEdit={() => { setEditing(consignment); setOpen(true); }} onDelete={() => setDeleting(consignment)} /> },
              ]}
              renderCard={(consignment) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading text-2xl">{consignment.supplier?.name || "سپلائر"}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{consignment.vehicleNumber || "بغیر نمبر"}</p>
                      </div>
                      <StatusPill label={consignmentStatusLabels[consignment.status]} tone={consignment.status === "OPEN" ? "warning" : "success"} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{formatDate(consignment.arrivalDate)}</p>
                    <RecordActions detailHref={`/consignments/${consignment.id}`} onEdit={() => { setEditing(consignment); setOpen(true); }} onDelete={() => setDeleting(consignment)} />
                  </CardContent>
                </Card>
              )}
            />
          ) : null}
        </div>
      </SectionCard>

      <ConsignmentDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={editing}
        loading={saveMutation.isPending}
        suppliers={suppliers}
        onSubmit={(values) => saveMutation.mutate({ id: editing?.id, values })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="یہ گاڑی مٹائیں؟"
        description="اگر اس کے ساتھ فروخت یا خرچے جڑے ہوں تو بیک اینڈ حذف کی اجازت نہیں دے گا۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function ConsignmentDetailPageClient({ id }: { id: string }) {
  const detailQuery = useQuery({
    queryKey: ["consignment", id],
    queryFn: () => consignmentsApi.get(id),
  });
  const summaryQuery = useQuery({
    queryKey: ["reports", "consignment-summary", id],
    queryFn: () => reportsApi.consignmentSummary(id),
  });
  const queryClient = useQueryClient();
  const closeMutation = useMutation({
    mutationFn: (notes?: string) => consignmentsApi.close(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignment", id] });
      queryClient.invalidateQueries({ queryKey: ["reports", "consignment-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      toast.success("گاڑی بند کر دی گئی");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const [confirmClose, setConfirmClose] = useState(false);

  if (detailQuery.isLoading || summaryQuery.isLoading) {
    return <LoadingState title="گاڑی کی تفصیل لوڈ ہو رہی ہے" />;
  }

  if (detailQuery.isError || summaryQuery.isError) {
    const error = (detailQuery.error || summaryQuery.error) as Error;
    return <ErrorState title="گاڑی کی تفصیل نہیں مل سکی" error={error.message} />;
  }

  if (!detailQuery.data || !summaryQuery.data) {
    return <EmptyState title="گاڑی نہیں ملی" description="اس گاڑی کا مکمل خلاصہ دستیاب نہیں۔" />;
  }

  const consignment = detailQuery.data;
  const report = summaryQuery.data;
  const reportSales = report.sales ?? [];
  const reportExpenses = report.expenses ?? [];
  const totalSales =
    Number(report?.totalSales ?? 0) ||
    reportSales.reduce((sum, sale) => sum + Number(sale.totalAmount ?? 0), 0);
  const totalExpenses =
    Number(report?.totalExpenses ?? 0) ||
    reportExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={consignment.supplier?.name || "مال / گاڑی"}
        description="اس گاڑی کے آئٹمز، حالت، خرچے، متعلقہ فروخت اور خلاصہ ایک نظر میں۔"
        action={
          <div className="flex gap-2">
            {consignment.status === "OPEN" ? (
              <Button onClick={() => setConfirmClose(true)}>گاڑی بند کریں</Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/consignments">
                <ArrowLeft className="size-4" />
                فہرست پر واپس
              </Link>
            </Button>
          </div>
        }
      />

      <SummaryCards
        items={[
          { title: "حالت", value: consignmentStatusLabels[consignment.status], tone: consignment.status === "OPEN" ? "warm" : "success" },
          { title: "مجموعی فروخت", value: formatCurrency(totalSales) },
          { title: "کل خرچے", value: formatCurrency(totalExpenses), tone: "danger" },
          { title: "آئٹمز", value: formatNumber(consignment.items?.length ?? 0), tone: "default" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="بنیادی معلومات" description="ٹرک، ڈرائیور، کمیشن اور نوٹس">
          <div className="grid gap-3">
            <MetaStat title="گاڑی نمبر" value={consignment.vehicleNumber || "موجود نہیں"} />
            <MetaStat title="ڈرائیور" value={consignment.driverName || "موجود نہیں"} />
            <MetaStat title="آمد" value={formatDate(consignment.arrivalDate)} />
            <MetaStat title="کمیشن" value={`${commissionTypeLabels[consignment.commissionType]} - ${formatNumber(consignment.commissionValue)}`} />
          </div>
        </SectionCard>

        <SectionCard title="مال کے آئٹمز" description="ہر پروڈکٹ کی موصول مقدار اور بنیادی ریٹ">
          {consignment.items?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {consignment.items.map((item) => (
                  <div key={item.id} className="rounded-[1.5rem] border border-[var(--brand-line)] bg-[var(--surface-soft)] p-4 dark:border-white/10 dark:bg-slate-900/60">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.productNameUrdu}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MetaStat title="موصول مقدار" value={formatNumber(item.quantityReceived)} />
                    <MetaStat title="بنیادی ریٹ" value={formatCurrency(item.baseRate ?? 0)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="آئٹمز موجود نہیں" description="اس گاڑی کے ساتھ کوئی آئٹم نہیں ملا۔" />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="متعلقہ فروخت" description="اس گاڑی کے مال سے بنی فروخت">
          {report?.sales?.length ? (
            <div className="space-y-3">
              {report.sales.map((sale) => (
                <div key={sale.id} className="rounded-2xl border border-[var(--brand-line)] bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{sale.customer?.name || "گاہک"}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{formatDate(sale.saleDate)}</p>
                    </div>
                    <p className="font-heading text-2xl">{formatCurrency(sale.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="فروخت موجود نہیں" description="ابھی اس گاڑی سے کوئی فروخت نہیں ملی۔" />
          )}
        </SectionCard>

        <SectionCard title="منسلک خرچے" description="اسی گاڑی سے وابستہ خرچے">
          {report?.expenses?.length ? (
            <div className="space-y-3">
              {report.expenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-[var(--brand-line)] bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{expense.titleUrdu}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{expenseTypeLabels[expense.expenseType]} - {formatDate(expense.expenseDate)}</p>
                    </div>
                    <p className="font-heading text-2xl">{formatCurrency(expense.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="خرچے موجود نہیں" description="اس گاڑی کے ساتھ ابھی کوئی خرچہ نہیں جوڑا گیا۔" />
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="یہ گاڑی بند کریں؟"
        description="یہ عمل دستی کنٹرول کے ساتھ اس گاڑی کا عملی چکر مکمل کرے گا۔"
        loading={closeMutation.isPending}
        confirmLabel="بند کریں"
        onConfirm={() => closeMutation.mutate(undefined)}
      />
    </div>
  );
}

export function SalesPageClient() {
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("all");
  const [editing, setEditing] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const salesQuery = useQuery({
    queryKey: ["sales", search, customerId],
    queryFn: () =>
      salesApi.list({
        search,
        limit: 100,
        customerId: customerId === "all" ? undefined : customerId,
      }),
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "sale-options"],
    queryFn: () => customersApi.list({ limit: 100, isActive: true }),
  });
  const consignmentsQuery = useQuery({
    queryKey: ["consignments", "sale-options"],
    queryFn: () => consignmentsApi.list({ limit: 100, status: "OPEN" }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ values, id }: { values: Partial<Sale>; id?: string }) => {
      if (id) return salesApi.update(id, values);
      return salesApi.create(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setOpen(false);
      setEditing(null);
      toast.success("فروخت محفوظ ہو گئی");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: salesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("فروخت حذف ہو گئی");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = salesQuery.data?.items ?? [];
  const customers = customersQuery.data?.items ?? [];
  const consignments = consignmentsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="فروخت"
        description="تیز انٹری ورک فلو کے ساتھ متعدد آئٹمز کی فروخت درج کریں اور گاہک کے کھاتے کو اپ ڈیٹ رکھیں۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نئی فروخت</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل فروخت", value: formatCurrency(items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)) },
          { title: "اندراجات", value: formatNumber(items.length), tone: "warm" },
          { title: "کل آئٹمز", value: formatNumber(items.reduce((sum, item) => sum + (item.items?.length ?? 0), 0)), tone: "default" },
          { title: "آج", value: formatCurrency(items.filter((item) => item.saleDate?.slice(0, 10) === todayDate()).reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)), tone: "success" },
        ]}
      />

      <SectionCard title="فروخت فہرست" description="گاہک، تاریخ، رقم اور آئٹمز کا خلاصہ۔">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          filters={
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="w-full min-w-48 bg-white dark:bg-slate-900/70 dark:border-white/10">
                <SelectValue placeholder="گاہک فلٹر" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام گاہک</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getCustomerOptionLabel(customer)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          }
        />
        <div className="mt-5">
          {salesQuery.isLoading ? <LoadingState title="فروخت لوڈ ہو رہی ہے" /> : null}
          {salesQuery.isError ? <ErrorState title="فروخت لوڈ نہیں ہو سکی" error={(salesQuery.error as Error).message} onRetry={() => salesQuery.refetch()} /> : null}
          {!salesQuery.isLoading && !salesQuery.isError && !items.length ? (
            <EmptyState title="فروخت موجود نہیں" description="نئی فروخت درج کریں تاکہ گاہک کے کھاتے میں ڈیبٹ شامل ہو۔" />
          ) : null}
          {!salesQuery.isLoading && !salesQuery.isError && items.length ? (
            <DataList
              data={items}
              getKey={(sale) => sale.id}
              columns={[
                { key: "customer", title: "گاہک", render: (sale) => sale.customer?.name || "گاہک" },
                { key: "date", title: "تاریخ", render: (sale) => formatDate(sale.saleDate) },
                { key: "items", title: "آئٹمز", render: (sale) => formatNumber(sale.items?.length ?? 0) },
                { key: "amount", title: "کل رقم", render: (sale) => <AmountText value={sale.totalAmount} /> },
                { key: "actions", title: "عمل", render: (sale) => <RecordActions onEdit={() => { setEditing(sale); setOpen(true); }} onDelete={() => setDeleting(sale)} /> },
              ]}
              renderCard={(sale) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading text-2xl">{sale.customer?.name || "گاہک"}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{formatDate(sale.saleDate)}</p>
                      </div>
                      <p className="font-heading text-2xl">{formatCurrency(sale.totalAmount)}</p>
                    </div>
                    <RecordActions onEdit={() => { setEditing(sale); setOpen(true); }} onDelete={() => setDeleting(sale)} />
                  </CardContent>
                </Card>
              )}
            />
          ) : null}
        </div>
      </SectionCard>

      <SaleDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={
          editing
            ? {
                ...editing,
                notes: editing.notes ?? "",
              }
            : null
        }
        loading={saveMutation.isPending}
        customers={customers}
        consignments={consignments}
        onSubmit={(values) => saveMutation.mutate({ id: editing?.id, values })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="فروخت حذف کریں؟"
        description="یہ عمل گاہک کے کھاتے پر اثر انداز ہوگا، اس لئے حذف کرنے سے پہلے تصدیق کر لیں۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function PaymentsPageClient() {
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("all");
  const [method, setMethod] = useState("all");
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [open, setOpen] = useState(false);

  const paymentsQuery = useQuery({
    queryKey: ["payments", search, customerId, method],
    queryFn: () =>
      paymentsApi.list({
        search,
        limit: 100,
        customerId: customerId === "all" ? undefined : customerId,
        method: method === "all" ? undefined : method,
      }),
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "payment-options"],
    queryFn: () => customersApi.list({ limit: 100, isActive: true }),
  });
  const { saveMutation, deleteMutation } = useCrudActions<Payment>(
    "payments",
    paymentsApi.create,
    paymentsApi.update,
    paymentsApi.remove,
    {
      onSaveSuccess: () => {
        setOpen(false);
        setEditing(null);
      },
    },
  );

  const items = paymentsQuery.data?.items ?? [];
  const customers = customersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="وصولی"
        description="گاہک کی ادائیگی کو تیزی سے درج کریں تاکہ کھاتہ میں کریڈٹ فوری شامل ہو جائے۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نئی وصولی</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل وصولی", value: formatCurrency(items.reduce((sum, item) => sum + Number(item.amount || 0), 0)), tone: "success" },
          { title: "اندراجات", value: formatNumber(items.length), tone: "warm" },
          { title: "نقد", value: formatCurrency(items.filter((item) => item.method === "CASH").reduce((sum, item) => sum + Number(item.amount || 0), 0)) },
          { title: "بینک / والیٹ", value: formatCurrency(items.filter((item) => item.method !== "CASH").reduce((sum, item) => sum + Number(item.amount || 0), 0)), tone: "default" },
        ]}
      />

      <SectionCard title="وصولی فہرست" description="ادائیگی طریقہ، تاریخ اور رقم کے ساتھ۔">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          filters={
            <>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full min-w-48 bg-white dark:bg-slate-900/70 dark:border-white/10">
                  <SelectValue placeholder="گاہک فلٹر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام گاہک</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getCustomerOptionLabel(customer)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full min-w-40 bg-white dark:bg-slate-900/70 dark:border-white/10">
                  <SelectValue placeholder="طریقہ فلٹر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام طریقے</SelectItem>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
        <div className="mt-5">
          {paymentsQuery.isLoading ? <LoadingState title="وصولیاں لوڈ ہو رہی ہیں" /> : null}
          {paymentsQuery.isError ? <ErrorState title="وصولیاں لوڈ نہیں ہو سکیں" error={(paymentsQuery.error as Error).message} onRetry={() => paymentsQuery.refetch()} /> : null}
          {!paymentsQuery.isLoading && !paymentsQuery.isError && !items.length ? (
            <EmptyState title="وصولی موجود نہیں" description="گاہک سے رقم وصول ہوتے ہی یہاں اندراج کریں۔" />
          ) : null}
          {!paymentsQuery.isLoading && !paymentsQuery.isError && items.length ? (
            <DataList
              data={items}
              getKey={(payment) => payment.id}
              columns={[
                { key: "customer", title: "گاہک", render: (payment) => payment.customer?.name || "گاہک" },
                { key: "date", title: "تاریخ", render: (payment) => formatDate(payment.paymentDate) },
                { key: "method", title: "طریقہ", render: (payment) => paymentMethodLabels[payment.method] },
                { key: "amount", title: "رقم", render: (payment) => <AmountText value={payment.amount} tone="success" /> },
                { key: "actions", title: "عمل", render: (payment) => <RecordActions onEdit={() => { setEditing(payment); setOpen(true); }} onDelete={() => setDeleting(payment)} /> },
              ]}
              renderCard={(payment) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading text-2xl">{payment.customer?.name || "گاہک"}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{paymentMethodLabels[payment.method]}</p>
                      </div>
                      <p className="font-heading text-2xl text-emerald-700">{formatCurrency(payment.amount)}</p>
                    </div>
                    <RecordActions onEdit={() => { setEditing(payment); setOpen(true); }} onDelete={() => setDeleting(payment)} />
                  </CardContent>
                </Card>
              )}
            />
          ) : null}
        </div>
      </SectionCard>

      <PaymentDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={editing}
        loading={saveMutation.isPending}
        customers={customers}
        onSubmit={(values) => saveMutation.mutate({ mode: editing ? "update" : "create", id: editing?.id, values })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="وصولی حذف کریں؟"
        description="یہ عمل گاہک کے چلتے بیلنس کو بدل دے گا۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function ExpensesPageClient() {
  const [search, setSearch] = useState("");
  const [expenseType, setExpenseType] = useState("all");
  const [consignmentId, setConsignmentId] = useState("all");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);

  const expensesQuery = useQuery({
    queryKey: ["expenses", search, expenseType, consignmentId],
    queryFn: () =>
      expensesApi.list({
        search,
        limit: 100,
        expenseType: expenseType === "all" ? undefined : expenseType,
        consignmentId: consignmentId === "all" ? undefined : consignmentId,
      }),
  });
  const consignmentsQuery = useQuery({
    queryKey: ["consignments", "expense-options"],
    queryFn: () => consignmentsApi.list({ limit: 100 }),
  });
  const { saveMutation, deleteMutation } = useCrudActions<Expense>(
    "expenses",
    expensesApi.create,
    expensesApi.update,
    expensesApi.remove,
    {
      onSaveSuccess: () => {
        setOpen(false);
        setEditing(null);
      },
    },
  );

  const items = expensesQuery.data?.items ?? [];
  const consignments = consignmentsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="خرچے"
        description="مزدوری، گاڑی کرایہ، کمیشن اور دیگر خرچے درج کریں، چاہیں تو کسی گاڑی سے بھی جوڑ دیں۔"
        action={<ActionButton onClick={() => { setEditing(null); setOpen(true); }}>نیا خرچہ</ActionButton>}
      />

      <SummaryCards
        items={[
          { title: "کل خرچے", value: formatCurrency(items.reduce((sum, item) => sum + Number(item.amount || 0), 0)), tone: "danger" },
          { title: "مزدوری", value: formatCurrency(items.filter((item) => item.expenseType === "LABOUR").reduce((sum, item) => sum + Number(item.amount || 0), 0)), tone: "warm" },
          { title: "گاڑی کرایہ", value: formatCurrency(items.filter((item) => item.expenseType === "VEHICLE_RENT").reduce((sum, item) => sum + Number(item.amount || 0), 0)) },
          { title: "کمیشن", value: formatCurrency(items.filter((item) => item.expenseType === "COMMISSION").reduce((sum, item) => sum + Number(item.amount || 0), 0)), tone: "default" },
        ]}
      />

      <SectionCard title="خرچوں کی فہرست" description="قسم، عنوان، تاریخ اور رقم کے ساتھ۔">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          filters={
            <>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger className="w-full min-w-40 bg-white dark:bg-slate-900/70 dark:border-white/10">
                  <SelectValue placeholder="قسم فلٹر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام اقسام</SelectItem>
                  {Object.entries(expenseTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={consignmentId} onValueChange={setConsignmentId}>
                <SelectTrigger className="w-full min-w-48 bg-white dark:bg-slate-900/70 dark:border-white/10">
                  <SelectValue placeholder="گاڑی فلٹر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام گاڑیاں</SelectItem>
                  {consignments.map((consignment) => (
                    <SelectItem key={consignment.id} value={consignment.id}>
                      {(consignment.supplier?.name ?? "سپلائر")} - {consignment.vehicleNumber || "بغیر نمبر"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
        <div className="mt-5">
          {expensesQuery.isLoading ? <LoadingState title="خرچے لوڈ ہو رہے ہیں" /> : null}
          {expensesQuery.isError ? <ErrorState title="خرچے لوڈ نہیں ہو سکے" error={(expensesQuery.error as Error).message} onRetry={() => expensesQuery.refetch()} /> : null}
          {!expensesQuery.isLoading && !expensesQuery.isError && !items.length ? (
            <EmptyState title="خرچے موجود نہیں" description="جیسے ہی خرچہ درج ہوگا، یہاں نظر آئے گا۔" />
          ) : null}
          {!expensesQuery.isLoading && !expensesQuery.isError && items.length ? (
            <DataList
              data={items}
              getKey={(expense) => expense.id}
              columns={[
                { key: "title", title: "عنوان", render: (expense) => expense.titleUrdu },
                { key: "type", title: "قسم", render: (expense) => expenseTypeLabels[expense.expenseType] },
                { key: "consignment", title: "گاڑی", render: (expense) => expense.consignment?.vehicleNumber || "منسلک نہیں" },
                { key: "date", title: "تاریخ", render: (expense) => formatDate(expense.expenseDate) },
                { key: "amount", title: "رقم", render: (expense) => <AmountText value={expense.amount} tone="warning" /> },
                { key: "actions", title: "عمل", render: (expense) => <RecordActions onEdit={() => { setEditing(expense); setOpen(true); }} onDelete={() => setDeleting(expense)} /> },
              ]}
              renderCard={(expense) => (
                <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading text-2xl">{expense.titleUrdu}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{expenseTypeLabels[expense.expenseType]}</p>
                      </div>
                      <p className="font-heading text-2xl">{formatCurrency(expense.amount)}</p>
                    </div>
                    <RecordActions onEdit={() => { setEditing(expense); setOpen(true); }} onDelete={() => setDeleting(expense)} />
                  </CardContent>
                </Card>
              )}
            />
          ) : null}
        </div>
      </SectionCard>

      <ExpenseDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
        initialValues={editing}
        loading={saveMutation.isPending}
        consignments={consignments}
        onSubmit={(values) => saveMutation.mutate({ mode: editing ? "update" : "create", id: editing?.id, values })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="خرچہ حذف کریں؟"
        description="اس عمل سے رپورٹس اور حساب کا خلاصہ تبدیل ہو سکتا ہے۔"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

export function ReportsIndexPageClient() {
  return (
    <RoleGuard
      roles={["OWNER"]}
      title="رپورٹس صرف مالک کے لئے ہیں"
      description="بیک اینڈ پالیسی کے مطابق مالی اور خلاصہ رپورٹس تک رسائی صرف مالک کو حاصل ہے۔"
    >
      <div className="space-y-6">
        <PageHeader
          title="رپورٹس"
          description="روزانہ فروخت، گاہک کھاتہ، مال کا خلاصہ اور سپلائر حساب کو پرنٹ یا شیئر کرنے کے قابل انداز میں دیکھیں۔"
        />

        <div className="grid gap-5 md:grid-cols-2">
          {reportLinks.map((report, index) => {
            const Icon = [BookOpen, Calculator, PackageSearch, ReceiptText][index];
            return (
              <Link
                key={report.href}
                href={report.href}
                className="rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-950/70"
              >
                <Icon className="size-10 text-[var(--brand-forest)]" />
                <p className="mt-5 font-heading text-3xl text-slate-950 dark:text-white">{report.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{report.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </RoleGuard>
  );
}

export function DailySalesReportPageClient() {
  const session = useSession();
  const isOwner = session?.role === "OWNER";
  const [date, setDate] = useState(todayDate());
  const [exporting, setExporting] = useState<"pdf" | "print" | null>(null);
  const query = useQuery({
    queryKey: ["reports", "daily-sales", date],
    queryFn: () => reportsApi.dailySales(date),
    enabled: isOwner,
  });

  return (
    <RoleGuard
      roles={["OWNER"]}
      title="یہ رپورٹ صرف مالک کے لئے ہے"
      description="روزانہ مالی خلاصہ اور پرنٹ ایبل رپورٹ تک رسائی مالک کے لئے محدود ہے۔"
    >
      <div className="space-y-6 print:space-y-4">
        <PageHeader
          title="روزانہ فروخت رپورٹ"
          description="ایک دن کی فروخت، انوائس کی تعداد اور مجموعی رقم واضح طور پر دیکھیں۔"
          action={
            <div className="flex gap-2 print:hidden">
              <Input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="w-44 bg-white dark:bg-slate-900/70 dark:border-white/10" />
              <PdfDownloadButton
                loading={exporting === "pdf"}
                onClick={async () => {
                  if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                  try {
                    setExporting("pdf");
                    const blob = await createDailySalesPdf(query.data);
                    downloadPdfBlob(blob, `daily-sales-report-${date}.pdf`);
                    toast.success("پی ڈی ایف ڈاؤن لوڈ ہو گئی");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "پی ڈی ایف تیار نہیں ہو سکی");
                  } finally {
                    setExporting(null);
                  }
                }}
              />
              <ReportPrintButton
                loading={exporting === "print"}
                onClick={async () => {
                  if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                  try {
                    setExporting("print");
                    const blob = await createDailySalesPdf(query.data);
                    openPdfBlob(blob);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "پرنٹ فائل تیار نہیں ہو سکی");
                  } finally {
                    setExporting(null);
                  }
                }}
              />
            </div>
          }
        />
        <ReportBody query={query}>
          {(report: DailySalesReport) => (
            <>
              <SummaryCards
                items={[
                  { title: "کل فروخت", value: formatCurrency(report.totalSales), tone: "warm" },
                  { title: "انوائس", value: formatNumber(report.totalInvoices), tone: "default" },
                  { title: "آئٹمز", value: formatNumber(report.totalItems ?? report.sales.reduce((sum, sale) => sum + (sale.items?.length ?? 0), 0)), tone: "success" },
                  { title: "گاہک", value: formatNumber(report.customers ?? new Set(report.sales.map((sale) => sale.customerId)).size), tone: "default" },
                ]}
              />
              <SectionCard title="فروخت تفصیل" description={`${formatDate(report.date)} کی مکمل فہرست`}>
                {report.sales?.length ? (
                  <DataList
                    data={report.sales}
                    getKey={(sale) => sale.id}
                    columns={[
                      { key: "customer", title: "گاہک", render: (sale) => sale.customer?.name || "گاہک" },
                      { key: "date", title: "تاریخ", render: (sale) => formatDate(sale.saleDate) },
                      { key: "items", title: "آئٹمز", render: (sale) => formatNumber(sale.items?.length ?? 0) },
                      { key: "amount", title: "کل رقم", render: (sale) => <AmountText value={sale.totalAmount} /> },
                    ]}
                    renderCard={(sale) => (
                      <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                        <CardContent className="space-y-3 p-5">
                          <p className="font-semibold">{sale.customer?.name || "گاہک"}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-300">{formatDate(sale.saleDate)}</p>
                          <p className="font-heading text-2xl">{formatCurrency(sale.totalAmount)}</p>
                        </CardContent>
                      </Card>
                    )}
                  />
                ) : (
                  <EmptyState title="اس دن فروخت موجود نہیں" description="تاریخ تبدیل کر کے دوبارہ دیکھیں۔" />
                )}
              </SectionCard>
            </>
          )}
        </ReportBody>
      </div>
    </RoleGuard>
  );
}

export function CustomerLedgerReportPageClient({ customerId: initialCustomerId }: { customerId?: string }) {
  const session = useSession();
  const isOwner = session?.role === "OWNER";
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "print" | null>(null);
  const customersQuery = useQuery({
    queryKey: ["customers", "ledger-options"],
    queryFn: () => customersApi.list({ limit: 100 }),
    enabled: isOwner,
  });
  const query = useQuery({
    queryKey: ["reports", "customer-ledger", customerId, from, to],
    queryFn: () => reportsApi.customerLedger(customerId, { from, to }),
    enabled: isOwner && !!customerId,
  });

  return (
    <RoleGuard
      roles={["OWNER"]}
      title="یہ رپورٹ صرف مالک کے لئے ہے"
      description="گاہک کھاتہ رپورٹ میں مکمل مالی تاریخ شامل ہوتی ہے، اس لئے یہ صرف مالک کو دکھائی جاتی ہے۔"
    >
    <div className="space-y-6">
      <PageHeader
        title="گاہک کھاتہ رپورٹ"
        description="ڈیبٹ، کریڈٹ اور چلتے بیلنس کے ساتھ گاہک کا مکمل حساب سمجھیں۔"
        action={
          <div className="flex gap-2 print:hidden">
            <PdfDownloadButton
              loading={exporting === "pdf"}
              onClick={async () => {
                if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                try {
                  setExporting("pdf");
                  const blob = await createCustomerLedgerPdf(query.data);
                  downloadPdfBlob(blob, `customer-ledger-${customerId || "report"}.pdf`);
                  toast.success("پی ڈی ایف ڈاؤن لوڈ ہو گئی");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "پی ڈی ایف تیار نہیں ہو سکی");
                } finally {
                  setExporting(null);
                }
              }}
            />
            <ReportPrintButton
              loading={exporting === "print"}
              onClick={async () => {
                if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                try {
                  setExporting("print");
                  const blob = await createCustomerLedgerPdf(query.data);
                  openPdfBlob(blob);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "پرنٹ فائل تیار نہیں ہو سکی");
                } finally {
                  setExporting(null);
                }
              }}
            />
          </div>
        }
      />

      <SectionCard title="فلٹر" description="گاہک اور تاریخ منتخب کریں">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <Select value={customerId || "none"} onValueChange={(value) => setCustomerId(value === "none" ? "" : value)}>
          <SelectTrigger className="w-full bg-white dark:bg-slate-900/70 dark:border-white/10">
              <SelectValue placeholder="گاہک منتخب کریں" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">گاہک منتخب کریں</SelectItem>
              {(customersQuery.data?.items ?? []).map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {getCustomerOptionLabel(customer)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={from} onChange={(event) => setFrom(event.target.value)} type="date" className="bg-white dark:bg-slate-900/70 dark:border-white/10" />
          <Input value={to} onChange={(event) => setTo(event.target.value)} type="date" className="bg-white dark:bg-slate-900/70 dark:border-white/10" />
        </div>
      </SectionCard>

      {!customerId ? (
        <EmptyState title="گاہک منتخب کریں" description="رپورٹ دیکھنے کے لئے پہلے گاہک منتخب کریں۔" />
      ) : (
        <ReportBody query={query}>
          {(report: CustomerLedgerReport) => (
            <>
              <SummaryCards
                items={[
                  { title: "کل فروخت", value: formatCurrency(report.totalSales), tone: "warm" },
                  { title: "کل وصولی", value: formatCurrency(report.totalPayments), tone: "success" },
                  { title: getBalanceLabel(report.balance), value: formatCurrency(Math.abs(report.balance)), tone: report.balance > 0 ? "danger" : report.balance < 0 ? "success" : "default" },
                  { title: "اندراجات", value: formatNumber(report.entries.length), tone: "default" },
                ]}
              />
              <SectionCard title={report.customer.name} description="فروخت = ڈیبٹ، وصولی = کریڈٹ">
                {report.entries?.length ? (
                  <DataList
                    data={report.entries}
                    getKey={(entry) => entry.id}
                    columns={[
                      { key: "date", title: "تاریخ", render: (entry) => formatDate(entry.date) },
                      { key: "type", title: "قسم", render: (entry) => <StatusPill label={entry.type === "SALE" ? "فروخت" : "وصولی"} tone={entry.type === "SALE" ? "warning" : "success"} /> },
                      { key: "debit", title: "ڈیبٹ", render: (entry) => formatCurrency(entry.debit) },
                      { key: "credit", title: "کریڈٹ", render: (entry) => formatCurrency(entry.credit) },
                      { key: "balance", title: "بیلنس", render: (entry) => formatCurrency(entry.balance) },
                    ]}
                    renderCard={(entry) => (
                      <Card className="border-[var(--brand-line)] bg-white/95 p-0 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                        <CardContent className="space-y-3 p-5">
                          <div className="flex items-center justify-between">
                            <StatusPill label={entry.type === "SALE" ? "فروخت" : "وصولی"} tone={entry.type === "SALE" ? "warning" : "success"} />
                            <p className="text-sm text-slate-500 dark:text-slate-300">{formatDate(entry.date)}</p>
                          </div>
                          <p className="font-semibold">{entry.description}</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div><p className="text-slate-500 dark:text-slate-300">ڈیبٹ</p><p className="dark:text-white">{formatCurrency(entry.debit)}</p></div>
                            <div><p className="text-slate-500 dark:text-slate-300">کریڈٹ</p><p className="dark:text-white">{formatCurrency(entry.credit)}</p></div>
                            <div><p className="text-slate-500 dark:text-slate-300">بیلنس</p><p className="dark:text-white">{formatCurrency(entry.balance)}</p></div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  />
                ) : (
                  <EmptyState title="اندراجات نہیں" description="اس منتخب مدت میں کوئی حرکت نہیں ملی۔" />
                )}
              </SectionCard>
            </>
          )}
        </ReportBody>
      )}
    </div>
    </RoleGuard>
  );
}

export function ConsignmentSummaryReportPageClient({ consignmentId: initialConsignmentId }: { consignmentId?: string }) {
  const session = useSession();
  const isOwner = session?.role === "OWNER";
  const [consignmentId, setConsignmentId] = useState(initialConsignmentId ?? "");
  const [exporting, setExporting] = useState<"pdf" | "print" | null>(null);
  const consignmentsQuery = useQuery({
    queryKey: ["consignments", "summary-options"],
    queryFn: () => consignmentsApi.list({ limit: 100 }),
    enabled: isOwner,
  });
  const query = useQuery({
    queryKey: ["reports", "consignment-summary", consignmentId],
    queryFn: () => reportsApi.consignmentSummary(consignmentId),
    enabled: isOwner && !!consignmentId,
  });

  return (
    <RoleGuard
      roles={["OWNER"]}
      title="یہ رپورٹ صرف مالک کے لئے ہے"
      description="مال کے خلاصہ میں فروخت، خرچے اور کمیشن کا مکمل مالی اثر شامل ہوتا ہے۔"
    >
    <div className="space-y-6">
      <PageHeader
        title="مال کا خلاصہ"
        description="ٹرک، فروخت، خرچے اور باقی صورتحال کو سمجھنے کے لئے۔"
        action={
          <div className="flex gap-2 print:hidden">
            <PdfDownloadButton
              loading={exporting === "pdf"}
              onClick={async () => {
                if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                try {
                  setExporting("pdf");
                  const blob = await createConsignmentSummaryPdf(query.data);
                  downloadPdfBlob(blob, `maal-summary-${consignmentId || "report"}.pdf`);
                  toast.success("پی ڈی ایف ڈاؤن لوڈ ہو گئی");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "پی ڈی ایف تیار نہیں ہو سکی");
                } finally {
                  setExporting(null);
                }
              }}
            />
            <ReportPrintButton
              loading={exporting === "print"}
              onClick={async () => {
                if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                try {
                  setExporting("print");
                  const blob = await createConsignmentSummaryPdf(query.data);
                  openPdfBlob(blob);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "پرنٹ فائل تیار نہیں ہو سکی");
                } finally {
                  setExporting(null);
                }
              }}
            />
          </div>
        }
      />

      <SectionCard title="گاڑی منتخب کریں" description="جس ٹرک یا لوڈ کا خلاصہ دیکھنا ہو وہ منتخب کریں">
        <Select value={consignmentId || "none"} onValueChange={(value) => setConsignmentId(value === "none" ? "" : value)}>
          <SelectTrigger className="w-full bg-white dark:bg-slate-900/70 dark:border-white/10 md:max-w-md">
            <SelectValue placeholder="گاڑی منتخب کریں" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">گاڑی منتخب کریں</SelectItem>
            {(consignmentsQuery.data?.items ?? []).map((consignment) => (
              <SelectItem key={consignment.id} value={consignment.id}>
                {(consignment.supplier?.name ?? "سپلائر")} - {consignment.vehicleNumber || "بغیر نمبر"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionCard>

      {!consignmentId ? (
        <EmptyState title="گاڑی منتخب کریں" description="خلاصہ دیکھنے کے لئے پہلے گاڑی منتخب کریں۔" />
      ) : (
        <ReportBody query={query}>
          {(report: ConsignmentSummaryReport) => {
            const sales = report.sales ?? [];
            const expenses = report.expenses ?? [];
            const consignmentItems = report.consignment?.items ?? [];

            return (
            <>
              <SummaryCards
                items={[
                  { title: "مجموعی فروخت", value: formatCurrency(report.totalSales), tone: "warm" },
                  { title: "کل خرچے", value: formatCurrency(report.totalExpenses), tone: "danger" },
                  { title: "فروخت اندراجات", value: formatNumber(sales.length), tone: "default" },
                  { title: "آئٹمز", value: formatNumber(consignmentItems.length), tone: "success" },
                ]}
              />
              <SectionCard title="بنیادی خلاصہ" description={`${report.consignment.supplier?.name ?? "سپلائر"} - ${report.consignment.vehicleNumber || "بغیر نمبر"}`}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetaStat title="آمد تاریخ" value={formatDate(report.consignment.arrivalDate)} />
                  <MetaStat title="حالت" value={consignmentStatusLabels[report.consignment.status]} />
                  <MetaStat title="کمیشن" value={`${commissionTypeLabels[report.consignment.commissionType]} - ${formatNumber(report.consignment.commissionValue)}`} />
                  <MetaStat title="خرچوں کی تعداد" value={formatNumber(expenses.length)} />
                </div>
              </SectionCard>
              <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="مال کے آئٹمز" description="موصولہ آئٹمز اور بنیادی ریٹ">
                  {consignmentItems.length ? (
                    <div className="grid gap-3">
                      {consignmentItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[var(--brand-line)] bg-[var(--surface-soft)] p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{item.productNameUrdu}</p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{item.unit || "اکائی درج نہیں"}</p>
                            </div>
                            <div className="text-left">
                              <p className="text-sm text-slate-500 dark:text-slate-300">موصول مقدار</p>
                              <p className="font-heading text-2xl">{formatNumber(item.quantityReceived)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="آئٹمز موجود نہیں" description="اس گاڑی کے ساتھ کوئی آئٹم نہیں ملا۔" />
                  )}
                </SectionCard>
                <SectionCard title="فروخت اور خرچے" description="عملی حرکت کا خلاصہ">
                  <div className="grid gap-3">
                    <MetaStat title="فروخت اندراجات" value={formatNumber(sales.length)} />
                    <MetaStat title="خرچوں کے اندراجات" value={formatNumber(expenses.length)} />
                    <MetaStat title="بچی مقدار" value={formatNumber(report.totalItemsRemaining ?? 0)} />
                    <MetaStat title="بکی مقدار" value={formatNumber(report.totalItemsSold ?? 0)} />
                  </div>
                </SectionCard>
              </div>
            </>
          );
          }}
        </ReportBody>
      )}
    </div>
    </RoleGuard>
  );
}

export function SupplierSettlementReportPageClient({ consignmentId: initialConsignmentId }: { consignmentId?: string }) {
  const session = useSession();
  const isOwner = session?.role === "OWNER";
  const [consignmentId, setConsignmentId] = useState(initialConsignmentId ?? "");
  const [exporting, setExporting] = useState<"pdf" | "print" | null>(null);
  const consignmentsQuery = useQuery({
    queryKey: ["consignments", "settlement-options"],
    queryFn: () => consignmentsApi.list({ limit: 100 }),
    enabled: isOwner,
  });
  const query = useQuery({
    queryKey: ["reports", "supplier-settlement", consignmentId],
    queryFn: () => reportsApi.supplierSettlement(consignmentId),
    enabled: isOwner && !!consignmentId,
  });

  return (
    <RoleGuard
      roles={["OWNER"]}
      title="یہ رپورٹ صرف مالک کے لئے ہے"
      description="سپلائر حساب مالی اختتامی رپورٹ ہے، اس لئے یہ صرف مالک کے لئے دستیاب ہے۔"
    >
    <div className="space-y-6">
      <PageHeader
        title="سپلائر حساب رپورٹ"
        description="مجموعی فروخت، کمیشن، خرچوں اور قابل ادائیگی رقم کو واضح طور پر دیکھیں۔"
        action={
          <div className="flex gap-2 print:hidden">
            <PdfDownloadButton
              loading={exporting === "pdf"}
              onClick={async () => {
                if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                try {
                  setExporting("pdf");
                  const blob = await createSupplierSettlementPdf(query.data);
                  downloadPdfBlob(blob, `supplier-account-${consignmentId || "report"}.pdf`);
                  toast.success("پی ڈی ایف ڈاؤن لوڈ ہو گئی");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "پی ڈی ایف تیار نہیں ہو سکی");
                } finally {
                  setExporting(null);
                }
              }}
            />
            <ReportPrintButton
              loading={exporting === "print"}
              onClick={async () => {
                if (!query.data) return toast.error("پہلے رپورٹ مکمل لوڈ ہونے دیں");
                try {
                  setExporting("print");
                  const blob = await createSupplierSettlementPdf(query.data);
                  openPdfBlob(blob);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "پرنٹ فائل تیار نہیں ہو سکی");
                } finally {
                  setExporting(null);
                }
              }}
            />
          </div>
        }
      />

      <SectionCard title="گاڑی منتخب کریں" description="اسی گاڑی کے لئے حساب نکالا جائے گا">
        <Select value={consignmentId || "none"} onValueChange={(value) => setConsignmentId(value === "none" ? "" : value)}>
          <SelectTrigger className="w-full bg-white dark:bg-slate-900/70 dark:border-white/10 md:max-w-md">
            <SelectValue placeholder="گاڑی منتخب کریں" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">گاڑی منتخب کریں</SelectItem>
            {(consignmentsQuery.data?.items ?? []).map((consignment) => (
              <SelectItem key={consignment.id} value={consignment.id}>
                {(consignment.supplier?.name ?? "سپلائر")} - {consignment.vehicleNumber || "بغیر نمبر"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionCard>

      {!consignmentId ? (
        <EmptyState title="گاڑی منتخب کریں" description="حساب دیکھنے کے لئے پہلے گاڑی منتخب کریں۔" />
      ) : (
        <ReportBody query={query}>
          {(report: SupplierSettlementReport) => (
            <>
              <SummaryCards
                items={[
                  { title: "مجموعی فروخت", value: formatCurrency(report.grossSale), tone: "warm" },
                  { title: "کمیشن", value: formatCurrency(report.commissionAmount), tone: "danger" },
                  { title: "خرچے", value: formatCurrency(report.expenseTotal), tone: "danger" },
                  { title: "قابل ادائیگی", value: formatCurrency(report.payable), tone: "success" },
                ]}
              />
              <SectionCard title={report.supplier.name} description="حساب فارمولا: مجموعی فروخت - کمیشن - خرچے">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetaStat title="گاڑی نمبر" value={report.consignment.vehicleNumber || "بغیر نمبر"} />
                  <MetaStat title="حالت" value={report.status || "زیر تکمیل"} />
                  <MetaStat title="کمیشن طریقہ" value={commissionTypeLabels[report.consignment.commissionType]} />
                  <MetaStat title="آمد" value={formatDate(report.consignment.arrivalDate)} />
                </div>
                <div className="mt-5 rounded-[1.75rem] border border-[var(--brand-line)] bg-[var(--surface-soft)] p-5">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span>مجموعی فروخت</span><span>{formatCurrency(report.grossSale)}</span></div>
                    <div className="flex items-center justify-between"><span>منفی کمیشن</span><span>{formatCurrency(report.commissionAmount)}</span></div>
                    <div className="flex items-center justify-between"><span>منفی خرچے</span><span>{formatCurrency(report.expenseTotal)}</span></div>
                    <div className="border-t border-[var(--brand-line)] pt-3 text-base font-semibold">
                      <div className="flex items-center justify-between"><span>سپلائر قابل ادائیگی</span><span>{formatCurrency(report.payable)}</span></div>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="حساب سمجھنے کے نکات" description="یہ خلاصہ سپلائر گفتگو یا پرنٹ کے لئے موزوں ہے">
                <div className="grid gap-3 md:grid-cols-2">
                  <MetaStat title="سپلائر" value={report.supplier.name} />
                  <MetaStat title="گاڑی کی حالت" value={consignmentStatusLabels[report.consignment.status]} />
                  <MetaStat title="کمیشن ویلیو" value={formatNumber(report.consignment.commissionValue)} />
                  <MetaStat title="کل آئٹمز" value={formatNumber(report.consignment.items?.length ?? 0)} />
                </div>
              </SectionCard>
            </>
          )}
        </ReportBody>
      )}
    </div>
    </RoleGuard>
  );
}

function ReportBody<T>({
  query,
  children,
}: {
  query: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    data: T | undefined;
    refetch: () => void;
  };
  children: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) return <LoadingState title="رپورٹ لوڈ ہو رہی ہے" />;
  if (query.isError) {
    return <ErrorState title="رپورٹ لوڈ نہیں ہو سکی" error={query.error?.message || "نامعلوم خرابی"} onRetry={query.refetch} />;
  }
  if (!query.data) {
    return <EmptyState title="ڈیٹا موجود نہیں" description="منتخب فلٹر کے مطابق کوئی رپورٹ دستیاب نہیں۔" />;
  }

  return <>{children(query.data)}</>;
}
