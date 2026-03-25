export type UserRole = "OWNER" | "OPERATOR";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type ConsignmentStatus = "OPEN" | "CLOSED";
export type CommissionType = "PERCENTAGE" | "FIXED";
export type PaymentMethod = "CASH" | "BANK" | "MOBILE_WALLET" | "ADJUSTMENT";
export type ExpenseType = "LABOUR" | "VEHICLE_RENT" | "COMMISSION" | "OTHER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  locale?: string | null;
  currency?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  balance?: number;
  totalSales?: number;
  totalPayments?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConsignmentItem {
  id?: string;
  consignmentId?: string;
  productNameUrdu: string;
  productNameRoman?: string | null;
  unit?: string | null;
  quantityReceived: number;
  baseRate?: number | null;
  quantitySold?: number;
  remainingQuantity?: number;
}

export interface Consignment {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  arrivalDate: string;
  notes?: string | null;
  commissionType: CommissionType;
  commissionValue: number;
  status: ConsignmentStatus;
  items: ConsignmentItem[];
  grossSale?: number;
  expenseTotal?: number;
  payable?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  id?: string;
  consignmentId: string;
  consignmentItemId: string;
  productNameUrdu: string;
  quantity: number;
  rate: number;
  lineTotal?: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customer?: Customer;
  saleDate: string;
  notes?: string | null;
  items: SaleItem[];
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  consignmentId?: string | null;
  consignment?: Consignment;
  expenseType: ExpenseType;
  titleUrdu: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ListResponse<T> {
  items: T[];
  meta?: PaginationMeta;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: "SALE" | "PAYMENT";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string | null;
}

export interface DailySalesReport {
  date: string;
  totalSales: number;
  totalInvoices: number;
  totalItems?: number;
  customers?: number;
  sales: Sale[];
}

export interface CustomerLedgerReport {
  customer: Customer;
  from?: string;
  to?: string;
  totalSales: number;
  totalPayments: number;
  balance: number;
  entries: LedgerEntry[];
}

export interface ConsignmentSummaryReport {
  consignment: Consignment;
  totalSales: number;
  totalExpenses: number;
  totalItemsSold?: number;
  totalItemsRemaining?: number;
  sales: Sale[];
  expenses: Expense[];
}

export interface SupplierSettlementReport {
  consignment: Consignment;
  supplier: Supplier;
  grossSale: number;
  commissionAmount: number;
  expenseTotal: number;
  payable: number;
  status?: "PENDING" | "PARTIAL" | "PAID";
}

export interface DashboardOverview {
  todaySalesAmount: number;
  todaySalesCount: number;
  activeConsignments: number;
  recentPaymentsTotal: number;
  recentExpensesTotal: number;
  customerOutstandingTotal: number;
  customerAdvanceTotal: number;
  openConsignmentValue: number;
  recentSales: Sale[];
  recentPayments: Payment[];
  recentExpenses: Expense[];
  topCustomers: Customer[];
}

export interface LoginPayload {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
  tenant?: Tenant | null;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined | null;
}
