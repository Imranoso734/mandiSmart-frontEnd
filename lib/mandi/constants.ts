import type {
  ExpenseType,
  PaymentMethod,
  UserRole,
  ConsignmentStatus,
  CommissionType,
} from "@/lib/mandi/types";

export const appName = "منڈی اسمارٹ";

export const roleLabels: Record<UserRole, string> = {
  OWNER: "مالک",
  OPERATOR: "مشی",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "نقد",
  BANK: "بینک",
  MOBILE_WALLET: "موبائل والیٹ",
  ADJUSTMENT: "ایڈجسٹمنٹ",
};

export const expenseTypeLabels: Record<ExpenseType, string> = {
  LABOUR: "مزدوری",
  VEHICLE_RENT: "گاڑی کرایہ",
  COMMISSION: "کمیشن",
  OTHER: "دیگر",
};

export const consignmentStatusLabels: Record<ConsignmentStatus, string> = {
  OPEN: "کھلا",
  CLOSED: "بند",
};

export const commissionTypeLabels: Record<CommissionType, string> = {
  PERCENTAGE: "فی صد",
  FIXED: "مقررہ رقم",
};

export const reportLinks = [
  {
    href: "/reports/daily-sales",
    title: "روزانہ فروخت",
    description: "آج یا کسی بھی تاریخ کی فروخت فوراً دیکھیں",
  },
  {
    href: "/reports/customer-ledger",
    title: "گاہک کھاتہ",
    description: "ڈیبٹ، کریڈٹ اور چلتا بیلنس سمجھیں",
  },
  {
    href: "/reports/consignment-summary",
    title: "مال کا خلاصہ",
    description: "ٹرک، آئٹمز، خرچے اور فروخت ایک جگہ",
  },
  {
    href: "/reports/supplier-settlement",
    title: "سپلائر حساب",
    description: "مجموعی فروخت، کمیشن، خرچہ اور آخری رقم",
  },
];

export const sidebarLinks = [
  { href: "/dashboard", title: "ڈیش بورڈ", roles: ["OWNER", "OPERATOR"] },
  { href: "/customers", title: "گاہک", roles: ["OWNER", "OPERATOR"] },
  { href: "/suppliers", title: "سپلائر", roles: ["OWNER", "OPERATOR"] },
  { href: "/consignments", title: "مال / گاڑی", roles: ["OWNER", "OPERATOR"] },
  { href: "/sales", title: "فروخت", roles: ["OWNER", "OPERATOR"] },
  { href: "/payments", title: "وصولی", roles: ["OWNER", "OPERATOR"] },
  { href: "/expenses", title: "خرچے", roles: ["OWNER", "OPERATOR"] },
  { href: "/reports", title: "رپورٹس", roles: ["OWNER"] },
  { href: "/users", title: "آپریٹرز", roles: ["OWNER"] },
  { href: "/settings", title: "سیٹنگز", roles: ["OWNER", "OPERATOR"] },
];
