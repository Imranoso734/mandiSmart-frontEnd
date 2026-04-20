import type { Customer, QueryParams } from "@/lib/mandi/types";

export function buildQuery(params?: QueryParams) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const result = searchParams.toString();
  return result ? `?${result}` : "";
}

export function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("ur-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ur-PK", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatOptionalCurrency(value?: number | null, fallback = "بعد میں درج ہوگی") {
  return value === undefined || value === null ? fallback : formatCurrency(value);
}

export function formatOptionalNumber(value?: number | null, fallback = "بعد میں درج ہوگی") {
  return value === undefined || value === null ? fallback : formatNumber(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "نامعلوم";

  try {
    return new Intl.DateTimeFormat("ur-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function normalizePhone(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(value?: string | null) {
  const digits = normalizePhone(value);
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function isValidPhone(value?: string | null) {
  return /^03\d{9}$/.test(normalizePhone(value));
}

export function phoneForPayload(value?: string | null) {
  const digits = normalizePhone(value);
  return digits || undefined;
}

export function todayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateBalance(customer?: Customer | null) {
  return Number(customer?.balance ?? (customer?.totalSales ?? 0) - (customer?.totalPayments ?? 0));
}

export function getBalanceLabel(balance: number) {
  if (balance > 0) return "واجب الادا";
  if (balance < 0) return "ایڈوانس";
  return "کھاتہ صاف";
}

export function getBalanceTone(balance: number) {
  if (balance > 0) return "text-amber-700 bg-amber-50 border-amber-200";
  if (balance < 0) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  return "text-slate-700 bg-slate-50 border-slate-200";
}

export function pickArray<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  const nested = record.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const nestedRecord = nested as Record<string, unknown>;
    for (const key of keys) {
      const value = nestedRecord[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

export function pickObject<T>(data: unknown, keys: string[]): T | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as T;
    }
  }

  const nested = record.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const nestedRecord = nested as Record<string, unknown>;
    for (const key of keys) {
      const value = nestedRecord[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as T;
      }
    }
  }

  return data as T;
}

export function pickPaginationMeta(data: unknown) {
  if (!data || typeof data !== "object") return undefined;

  const root = data as Record<string, unknown>;
  const candidates = [
    root,
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : null,
  ].filter(Boolean) as Record<string, unknown>[];

  for (const candidate of candidates) {
    const total = typeof candidate.total === "number" ? candidate.total : undefined;
    const page = typeof candidate.page === "number" ? candidate.page : undefined;
    const limit = typeof candidate.limit === "number" ? candidate.limit : undefined;
    const totalPages =
      typeof candidate.totalPages === "number"
        ? candidate.totalPages
        : total !== undefined && limit
          ? Math.ceil(total / limit)
          : undefined;

    if (total !== undefined || page !== undefined || limit !== undefined || totalPages !== undefined) {
      return { total, page, limit, totalPages };
    }
  }

  return undefined;
}
