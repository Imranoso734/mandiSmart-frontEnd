import { sessionStore } from "@/lib/mandi/session";
import {
  buildQuery,
  pickArray,
  pickPaginationMeta,
  pickObject,
} from "@/lib/mandi/utils";
import type {
  AuthSession,
  Consignment,
  ConsignmentSummaryReport,
  Customer,
  CustomerLedgerReport,
  DailySalesReport,
  Expense,
  ListResponse,
  LoginPayload,
  Payment,
  QueryParams,
  Sale,
  SessionUser,
  Supplier,
  SupplierSettlementReport,
  Tenant,
  User,
} from "@/lib/mandi/types";

const API_ROOT = `${(process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "")}/api/v1`;
const GLOBAL_LOADER_EVENT = "mandi:api-loader";

function emitGlobalLoader(type: "start" | "end") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GLOBAL_LOADER_EVENT, { detail: { type } }));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = sessionStore.getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  emitGlobalLoader("start");

  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const message =
        (data as { message?: string } | null)?.message ??
        "درخواست مکمل نہیں ہو سکی";

      if (response.status === 401 || response.status === 403) {
        sessionStore.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      throw new Error(message);
    }

    return data as T;
  } finally {
    emitGlobalLoader("end");
  }
}

function normalizeSession(data: unknown): AuthSession {
  const root = (data ?? {}) as Record<string, unknown>;
  const payload =
    (root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root);
  const authRoot =
    (payload.auth && typeof payload.auth === "object" && !Array.isArray(payload.auth)
      ? (payload.auth as Record<string, unknown>)
      : payload);

  const token =
    (authRoot as { token?: string }).token ??
    (payload as { token?: string }).token ??
    (root as { token?: string }).token ??
    "";

  const rawUser =
    (payload.user && typeof payload.user === "object" && !Array.isArray(payload.user)
      ? (payload.user as SessionUser)
      : root.user && typeof root.user === "object" && !Array.isArray(root.user)
        ? (root.user as SessionUser)
        : null);

  const rawTenant =
    (payload.tenant && typeof payload.tenant === "object" && !Array.isArray(payload.tenant)
      ? (payload.tenant as Tenant)
      : root.tenant && typeof root.tenant === "object" && !Array.isArray(root.tenant)
        ? (root.tenant as Tenant)
        : null);

  const user =
    rawUser ??
    ({ id: "", name: "", email: "", role: "OPERATOR" } as SessionUser);
  const tenant = rawTenant;

  return { token, user, tenant };
}

function normalizeList<T>(data: unknown, keys: string[]): ListResponse<T> {
  const root = (data ?? {}) as Record<string, unknown>;
  const items = pickArray<T>(root, keys);
  const meta =
    pickObject<ListResponse<T>["meta"]>(root, ["meta", "pagination"]) ?? pickPaginationMeta(root);
  return { items, meta: meta ?? undefined };
}

function normalizeDateTime(value?: string | null) {
  if (!value) return value;
  if (value.includes("T")) return value;
  return `${value}T00:00:00.000Z`;
}

function normalizeConsignmentPayload(payload: Partial<Consignment>) {
  return {
    ...payload,
    supplierId:
      payload.supplierId === undefined || payload.supplierId === null || payload.supplierId === ""
        ? payload.supplierId
        : Number(payload.supplierId),
    arrivalDate: normalizeDateTime(payload.arrivalDate),
    commissionValue:
      payload.commissionValue === undefined || payload.commissionValue === null
        ? payload.commissionValue
        : Number(payload.commissionValue),
    items: payload.items?.map((item) => ({
      ...item,
      quantityReceived:
        item.quantityReceived === undefined || item.quantityReceived === null
          ? item.quantityReceived
          : Number(item.quantityReceived),
      baseRate:
        item.baseRate === undefined || item.baseRate === null
          ? item.baseRate
          : Number(item.baseRate),
    })),
  };
}

function normalizeSalePayload(payload: Partial<Sale>) {
  return {
    ...payload,
    customerId:
      payload.customerId === undefined || payload.customerId === null || payload.customerId === ""
        ? payload.customerId
        : Number(payload.customerId),
    saleDate: normalizeDateTime(payload.saleDate),
    items: payload.items?.map((item) => ({
      ...item,
      consignmentId:
        item.consignmentId === undefined || item.consignmentId === null || item.consignmentId === ""
          ? item.consignmentId
          : Number(item.consignmentId),
      consignmentItemId:
        item.consignmentItemId === undefined ||
        item.consignmentItemId === null ||
        item.consignmentItemId === ""
          ? item.consignmentItemId
          : Number(item.consignmentItemId),
      quantity: item.quantity === undefined || item.quantity === null ? item.quantity : Number(item.quantity),
      rate: item.rate === undefined || item.rate === null ? item.rate : Number(item.rate),
    })),
  };
}

function normalizePaymentPayload(payload: Partial<Payment>) {
  return {
    ...payload,
    customerId:
      payload.customerId === undefined || payload.customerId === null || payload.customerId === ""
        ? payload.customerId
        : Number(payload.customerId),
    paymentDate: normalizeDateTime(payload.paymentDate),
    amount: payload.amount === undefined || payload.amount === null ? payload.amount : Number(payload.amount),
  };
}

function normalizeExpensePayload(payload: Partial<Expense>) {
  return {
    ...payload,
    consignmentId:
      payload.consignmentId === undefined || payload.consignmentId === null || payload.consignmentId === ""
        ? undefined
        : Number(payload.consignmentId),
    expenseDate: normalizeDateTime(payload.expenseDate),
    amount: payload.amount === undefined || payload.amount === null ? payload.amount : Number(payload.amount),
  };
}

function normalizeUserPayload(payload: Partial<User> & { password?: string }) {
  return {
    ...payload,
    password: payload.password?.trim() ? payload.password : undefined,
  };
}

export const authApi = {
  login(payload: LoginPayload) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then(normalizeSession);
  },
  me() {
    return request<unknown>("/auth/me").then((data) => {
      const root = (data ?? {}) as Record<string, unknown>;
      const payload =
        root.data && typeof root.data === "object" && !Array.isArray(root.data)
          ? (root.data as Record<string, unknown>)
          : root;

      if (payload.user && typeof payload.user === "object" && !Array.isArray(payload.user)) {
        return payload.user as unknown as SessionUser;
      }

      if (root.user && typeof root.user === "object" && !Array.isArray(root.user)) {
        return root.user as unknown as SessionUser;
      }

      return payload as unknown as SessionUser;
    });
  },
};

export const tenantApi = {
  me() {
    return request<unknown>("/tenant/me").then((data) =>
      pickObject<Tenant>(data, ["tenant", "data"]) ?? (data as Tenant),
    );
  },
  update(payload: Partial<Tenant>) {
    return request<unknown>("/tenant/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((data) => pickObject<Tenant>(data, ["tenant", "data"]) ?? (data as Tenant));
  },
};

export const usersApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/users${buildQuery(params)}`).then((data) =>
      normalizeList<User>(data, ["users", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/users/${id}`).then((data) =>
      pickObject<User>(data, ["user", "data"]) ?? (data as User),
    );
  },
  create(payload: Partial<User> & { password?: string }) {
    return request<unknown>("/users", {
      method: "POST",
      body: JSON.stringify(normalizeUserPayload(payload)),
    }).then((data) => pickObject<User>(data, ["user", "data"]) ?? (data as User));
  },
  update(id: string, payload: Partial<User> & { password?: string }) {
    return request<unknown>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(normalizeUserPayload(payload)),
    }).then((data) => pickObject<User>(data, ["user", "data"]) ?? (data as User));
  },
  remove(id: string) {
    return request(`/users/${id}`, { method: "DELETE" });
  },
};

export const customersApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/customers${buildQuery(params)}`).then((data) =>
      normalizeList<Customer>(data, ["customers", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/customers/${id}`).then((data) =>
      pickObject<Customer>(data, ["customer", "data"]) ?? (data as Customer),
    );
  },
  create(payload: Partial<Customer>) {
    return request<unknown>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((data) => pickObject<Customer>(data, ["customer", "data"]) ?? (data as Customer));
  },
  update(id: string, payload: Partial<Customer>) {
    return request<unknown>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((data) => pickObject<Customer>(data, ["customer", "data"]) ?? (data as Customer));
  },
  remove(id: string) {
    return request(`/customers/${id}`, { method: "DELETE" });
  },
};

export const suppliersApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/suppliers${buildQuery(params)}`).then((data) =>
      normalizeList<Supplier>(data, ["suppliers", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/suppliers/${id}`).then((data) =>
      pickObject<Supplier>(data, ["supplier", "data"]) ?? (data as Supplier),
    );
  },
  create(payload: Partial<Supplier>) {
    return request<unknown>("/suppliers", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((data) => pickObject<Supplier>(data, ["supplier", "data"]) ?? (data as Supplier));
  },
  update(id: string, payload: Partial<Supplier>) {
    return request<unknown>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((data) => pickObject<Supplier>(data, ["supplier", "data"]) ?? (data as Supplier));
  },
  remove(id: string) {
    return request(`/suppliers/${id}`, { method: "DELETE" });
  },
};

export const consignmentsApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/consignments${buildQuery(params)}`).then((data) =>
      normalizeList<Consignment>(data, ["consignments", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/consignments/${id}`).then((data) =>
      pickObject<Consignment>(data, ["consignment", "data"]) ?? (data as Consignment),
    );
  },
  create(payload: Partial<Consignment>) {
    return request<unknown>("/consignments", {
      method: "POST",
      body: JSON.stringify(normalizeConsignmentPayload(payload)),
    }).then((data) => pickObject<Consignment>(data, ["consignment", "data"]) ?? (data as Consignment));
  },
  update(id: string, payload: Partial<Consignment>) {
    return request<unknown>(`/consignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(normalizeConsignmentPayload(payload)),
    }).then((data) => pickObject<Consignment>(data, ["consignment", "data"]) ?? (data as Consignment));
  },
  close(id: string, notes?: string) {
    return request<unknown>(`/consignments/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  },
  remove(id: string) {
    return request(`/consignments/${id}`, { method: "DELETE" });
  },
};

export const salesApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/sales${buildQuery(params)}`).then((data) =>
      normalizeList<Sale>(data, ["sales", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/sales/${id}`).then((data) =>
      pickObject<Sale>(data, ["sale", "data"]) ?? (data as Sale),
    );
  },
  create(payload: Partial<Sale>) {
    return request<unknown>("/sales", {
      method: "POST",
      body: JSON.stringify(normalizeSalePayload(payload)),
    }).then((data) => pickObject<Sale>(data, ["sale", "data"]) ?? (data as Sale));
  },
  update(id: string, payload: Partial<Sale>) {
    return request<unknown>(`/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify(normalizeSalePayload(payload)),
    }).then((data) => pickObject<Sale>(data, ["sale", "data"]) ?? (data as Sale));
  },
  remove(id: string) {
    return request(`/sales/${id}`, { method: "DELETE" });
  },
};

export const paymentsApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/payments${buildQuery(params)}`).then((data) =>
      normalizeList<Payment>(data, ["payments", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/payments/${id}`).then((data) =>
      pickObject<Payment>(data, ["payment", "data"]) ?? (data as Payment),
    );
  },
  create(payload: Partial<Payment>) {
    return request<unknown>("/payments", {
      method: "POST",
      body: JSON.stringify(normalizePaymentPayload(payload)),
    }).then((data) => pickObject<Payment>(data, ["payment", "data"]) ?? (data as Payment));
  },
  update(id: string, payload: Partial<Payment>) {
    return request<unknown>(`/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(normalizePaymentPayload(payload)),
    }).then((data) => pickObject<Payment>(data, ["payment", "data"]) ?? (data as Payment));
  },
  remove(id: string) {
    return request(`/payments/${id}`, { method: "DELETE" });
  },
};

export const expensesApi = {
  list(params?: QueryParams) {
    return request<unknown>(`/expenses${buildQuery(params)}`).then((data) =>
      normalizeList<Expense>(data, ["expenses", "data", "items"]),
    );
  },
  get(id: string) {
    return request<unknown>(`/expenses/${id}`).then((data) =>
      pickObject<Expense>(data, ["expense", "data"]) ?? (data as Expense),
    );
  },
  create(payload: Partial<Expense>) {
    return request<unknown>("/expenses", {
      method: "POST",
      body: JSON.stringify(normalizeExpensePayload(payload)),
    }).then((data) => pickObject<Expense>(data, ["expense", "data"]) ?? (data as Expense));
  },
  update(id: string, payload: Partial<Expense>) {
    return request<unknown>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(normalizeExpensePayload(payload)),
    }).then((data) => pickObject<Expense>(data, ["expense", "data"]) ?? (data as Expense));
  },
  remove(id: string) {
    return request(`/expenses/${id}`, { method: "DELETE" });
  },
};

export const reportsApi = {
  dailySales(date: string) {
    return request<unknown>(`/reports/daily-sales${buildQuery({ date })}`).then((data) =>
      pickObject<DailySalesReport>(data, ["report", "data"]) ?? (data as DailySalesReport),
    );
  },
  customerLedger(id: string, params?: QueryParams) {
    return request<unknown>(`/reports/customer-ledger/${id}${buildQuery(params)}`).then((data) =>
      pickObject<CustomerLedgerReport>(data, ["report", "data"]) ?? (data as CustomerLedgerReport),
    );
  },
  consignmentSummary(id: string) {
    return request<unknown>(`/reports/consignment-summary/${id}`).then((data) =>
      pickObject<ConsignmentSummaryReport>(data, ["report", "data"]) ??
      (data as ConsignmentSummaryReport),
    );
  },
  supplierSettlement(id: string) {
    return request<unknown>(`/reports/supplier-settlement/${id}`).then((data) =>
      pickObject<SupplierSettlementReport>(data, ["report", "data"]) ??
      (data as SupplierSettlementReport),
    );
  },
};
