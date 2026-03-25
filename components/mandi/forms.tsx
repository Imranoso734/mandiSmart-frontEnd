"use client";

import { useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { commissionTypeLabels, expenseTypeLabels, paymentMethodLabels, roleLabels } from "@/lib/mandi/constants";
import type {
  CommissionType,
  Consignment,
  Customer,
  Expense,
  Payment,
  Supplier,
  User,
} from "@/lib/mandi/types";
import { formatCurrency, todayDate } from "@/lib/mandi/utils";

type DialogBaseProps<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<T> | null;
  onSubmit: (payload: Partial<T>) => void;
  loading?: boolean;
};

type ConsignmentItemFormRow = {
  id?: string;
  productNameUrdu: string;
  productNameRoman: string;
  unit: string;
  quantityReceived: number;
  baseRate: number;
};

type ConsignmentFormValues = Omit<Partial<Consignment>, "items"> & {
  items: ConsignmentItemFormRow[];
};

function DialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/70 bg-white/95 sm:max-w-3xl dark:border-white/10 dark:bg-slate-950/95">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl dark:text-white">{title}</DialogTitle>
          <DialogDescription className="leading-7 dark:text-slate-300">{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function FormActions({ loading, submitLabel }: { loading?: boolean; submitLabel: string }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--brand-line)] pt-5 dark:border-white/10 sm:flex-row sm:justify-start">
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
}

export function CustomerDialog(props: DialogBaseProps<Customer>) {
  const form = useForm<Partial<Customer>>({
    defaultValues: {
      name: props.initialValues?.name ?? "",
      phone: props.initialValues?.phone ?? "",
      address: props.initialValues?.address ?? "",
      notes: props.initialValues?.notes ?? "",
      isActive: props.initialValues?.isActive ?? true,
    },
    values: {
      name: props.initialValues?.name ?? "",
      phone: props.initialValues?.phone ?? "",
      address: props.initialValues?.address ?? "",
      notes: props.initialValues?.notes ?? "",
      isActive: props.initialValues?.isActive ?? true,
    },
  });

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "گاہک میں ترمیم" : "نیا گاہک"}
      description="گاہک کا بنیادی ریکارڈ رکھیں تاکہ کھاتہ اور وصولی واضح رہے۔"
    >
      <form onSubmit={form.handleSubmit((values) => props.onSubmit(values))} className="space-y-5">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>نام</FieldLabel>
            <Input {...form.register("name", { required: "نام ضروری ہے" })} placeholder="مثلاً ساجد فروٹ" />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel>فون</FieldLabel>
            <Input {...form.register("phone")} placeholder="فون نمبر" />
          </Field>
          <Field>
            <FieldLabel>پتہ</FieldLabel>
            <Input {...form.register("address")} placeholder="گاہک کا پتہ" />
          </Field>
          <Field>
            <FieldLabel>حالت</FieldLabel>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Select value={field.value ? "true" : "false"} onValueChange={(value) => field.onChange(value === "true")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="حالت منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">فعال</SelectItem>
                    <SelectItem value="false">غیر فعال</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel>نوٹ</FieldLabel>
          <textarea
            {...form.register("notes")}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 dark:bg-slate-900/50 dark:text-white"
            placeholder="اگر کوئی خاص بات ہو تو یہاں لکھیں"
          />
        </Field>
        <FormActions loading={props.loading} submitLabel="ریکارڈ محفوظ کریں" />
      </form>
    </DialogShell>
  );
}

export function SupplierDialog(props: DialogBaseProps<Supplier>) {
  const form = useForm<Partial<Supplier>>({
    defaultValues: {
      name: props.initialValues?.name ?? "",
      phone: props.initialValues?.phone ?? "",
      address: props.initialValues?.address ?? "",
      notes: props.initialValues?.notes ?? "",
      isActive: props.initialValues?.isActive ?? true,
    },
    values: {
      name: props.initialValues?.name ?? "",
      phone: props.initialValues?.phone ?? "",
      address: props.initialValues?.address ?? "",
      notes: props.initialValues?.notes ?? "",
      isActive: props.initialValues?.isActive ?? true,
    },
  });

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "سپلائر میں ترمیم" : "نیا سپلائر"}
      description="سپلائر یا کسان کا ریکارڈ اس کی گاڑیوں اور حساب کے لئے استعمال ہوگا۔"
    >
      <form onSubmit={form.handleSubmit((values) => props.onSubmit(values))} className="space-y-5">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>نام</FieldLabel>
            <Input {...form.register("name", { required: "نام ضروری ہے" })} placeholder="مثلاً حاجی مقصود" />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel>فون</FieldLabel>
            <Input {...form.register("phone")} placeholder="فون نمبر" />
          </Field>
          <Field>
            <FieldLabel>پتہ</FieldLabel>
            <Input {...form.register("address")} placeholder="گاوں یا پتہ" />
          </Field>
          <Field>
            <FieldLabel>حالت</FieldLabel>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Select value={field.value ? "true" : "false"} onValueChange={(value) => field.onChange(value === "true")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="حالت منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">فعال</SelectItem>
                    <SelectItem value="false">غیر فعال</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel>نوٹ</FieldLabel>
          <textarea
            {...form.register("notes")}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 dark:bg-slate-900/50 dark:text-white"
            placeholder="معاہدہ یا خاص ہدایات"
          />
        </Field>
        <FormActions loading={props.loading} submitLabel="ریکارڈ محفوظ کریں" />
      </form>
    </DialogShell>
  );
}

export function UserDialog(props: DialogBaseProps<User & { password?: string }>) {
  const form = useForm<Partial<User> & { password?: string }>({
    defaultValues: {
      name: props.initialValues?.name ?? "",
      email: props.initialValues?.email ?? "",
      phone: props.initialValues?.phone ?? "",
      role: props.initialValues?.role ?? "OPERATOR",
      password: "",
      isActive: props.initialValues?.isActive ?? true,
    },
    values: {
      name: props.initialValues?.name ?? "",
      email: props.initialValues?.email ?? "",
      phone: props.initialValues?.phone ?? "",
      role: props.initialValues?.role ?? "OPERATOR",
      password: "",
      isActive: props.initialValues?.isActive ?? true,
    },
  });

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "آپریٹر میں ترمیم" : "نیا آپریٹر"}
      description="صرف مالک اس ماڈیول سے مشی یا اضافی صارف بنا سکتا ہے۔"
    >
      <form onSubmit={form.handleSubmit((values) => props.onSubmit(values))} className="space-y-5">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>نام</FieldLabel>
            <Input {...form.register("name", { required: "نام ضروری ہے" })} placeholder="صارف کا نام" />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel>ای میل</FieldLabel>
            <Input {...form.register("email", { required: "ای میل ضروری ہے" })} placeholder="صارف کی ای میل" dir="ltr" />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field>
            <FieldLabel>فون</FieldLabel>
            <Input {...form.register("phone")} placeholder="فون نمبر" />
          </Field>
          <Field>
            <FieldLabel>رول</FieldLabel>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="رول منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>{props.initialValues?.id ? "نیا پاس ورڈ" : "پاس ورڈ"}</FieldLabel>
            <Input {...form.register("password")} type="password" placeholder="کم از کم 8 حروف" dir="ltr" />
          </Field>
          <Field>
            <FieldLabel>حالت</FieldLabel>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Select value={field.value ? "true" : "false"} onValueChange={(value) => field.onChange(value === "true")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="حالت منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">فعال</SelectItem>
                    <SelectItem value="false">غیر فعال</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
        <FormActions loading={props.loading} submitLabel="صارف محفوظ کریں" />
      </form>
    </DialogShell>
  );
}

export function ExpenseDialog({
  consignments,
  ...props
}: DialogBaseProps<Expense> & {
  consignments: Consignment[];
}) {
  const form = useForm<Partial<Expense>>({
    defaultValues: {
      consignmentId: props.initialValues?.consignmentId ?? "",
      expenseType: props.initialValues?.expenseType ?? "LABOUR",
      titleUrdu: props.initialValues?.titleUrdu ?? "",
      amount: props.initialValues?.amount ?? 0,
      expenseDate: props.initialValues?.expenseDate?.slice(0, 10) ?? todayDate(),
      notes: props.initialValues?.notes ?? "",
    },
    values: {
      consignmentId: props.initialValues?.consignmentId ?? "",
      expenseType: props.initialValues?.expenseType ?? "LABOUR",
      titleUrdu: props.initialValues?.titleUrdu ?? "",
      amount: props.initialValues?.amount ?? 0,
      expenseDate: props.initialValues?.expenseDate?.slice(0, 10) ?? todayDate(),
      notes: props.initialValues?.notes ?? "",
    },
  });

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "خرچہ میں ترمیم" : "نیا خرچہ"}
      description="خرچہ گاڑی سے جوڑنے سے سپلائر حساب زیادہ واضح ہو جاتا ہے۔"
    >
      <form onSubmit={form.handleSubmit((values) => props.onSubmit(values))} className="space-y-5">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>خرچہ قسم</FieldLabel>
            <Controller
              control={form.control}
              name="expenseType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="قسم منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(expenseTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>گاڑی</FieldLabel>
            <Controller
              control={form.control}
              name="consignmentId"
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختیاری" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">منسلک نہیں</SelectItem>
                    {consignments.map((consignment) => (
                      <SelectItem key={consignment.id} value={consignment.id}>
                        {consignment.supplier?.name ?? "سپلائر"} - {consignment.vehicleNumber || "بغیر نمبر"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>عنوان</FieldLabel>
            <Input {...form.register("titleUrdu", { required: "عنوان ضروری ہے" })} placeholder="مثلاً مزدوری" />
            <FieldError errors={[form.formState.errors.titleUrdu]} />
          </Field>
          <Field>
            <FieldLabel>رقم</FieldLabel>
            <Input {...form.register("amount", { valueAsNumber: true })} type="number" min="0" placeholder="0" />
          </Field>
          <Field>
            <FieldLabel>تاریخ</FieldLabel>
            <Input {...form.register("expenseDate")} type="date" />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel>نوٹ</FieldLabel>
          <textarea
            {...form.register("notes")}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 dark:bg-slate-900/50 dark:text-white"
            placeholder="اضافی وضاحت"
          />
        </Field>
        <FormActions loading={props.loading} submitLabel="خرچہ محفوظ کریں" />
      </form>
    </DialogShell>
  );
}

export function PaymentDialog({
  customers,
  ...props
}: DialogBaseProps<Payment> & {
  customers: Customer[];
}) {
  const form = useForm<Partial<Payment>>({
    defaultValues: {
      customerId: props.initialValues?.customerId ?? "",
      amount: props.initialValues?.amount ?? 0,
      paymentDate: props.initialValues?.paymentDate?.slice(0, 10) ?? todayDate(),
      method: props.initialValues?.method ?? "CASH",
      reference: props.initialValues?.reference ?? "",
      notes: props.initialValues?.notes ?? "",
    },
    values: {
      customerId: props.initialValues?.customerId ?? "",
      amount: props.initialValues?.amount ?? 0,
      paymentDate: props.initialValues?.paymentDate?.slice(0, 10) ?? todayDate(),
      method: props.initialValues?.method ?? "CASH",
      reference: props.initialValues?.reference ?? "",
      notes: props.initialValues?.notes ?? "",
    },
  });

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "وصولی میں ترمیم" : "نئی وصولی"}
      description="یہ اندراج گاہک کے کھاتے میں کریڈٹ پیدا کرے گا۔"
    >
      <form onSubmit={form.handleSubmit((values) => props.onSubmit(values))} className="space-y-5">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>گاہک</FieldLabel>
            <Controller
              control={form.control}
              name="customerId"
              rules={{ required: "گاہک ضروری ہے" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="گاہک منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.customerId]} />
          </Field>
          <Field>
            <FieldLabel>رقم</FieldLabel>
            <Input {...form.register("amount", { valueAsNumber: true })} type="number" min="0" placeholder="0" />
          </Field>
          <Field>
            <FieldLabel>ادائیگی طریقہ</FieldLabel>
            <Controller
              control={form.control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="طریقہ منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>تاریخ</FieldLabel>
            <Input {...form.register("paymentDate")} type="date" />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>حوالہ</FieldLabel>
            <Input {...form.register("reference")} placeholder="مثلاً بینک سلپ یا رسید نمبر" />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel>نوٹ</FieldLabel>
          <textarea
            {...form.register("notes")}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 dark:bg-slate-900/50 dark:text-white"
            placeholder="ضرورت ہو تو مختصر نوٹ"
          />
        </Field>
        <FormActions loading={props.loading} submitLabel="وصولی محفوظ کریں" />
      </form>
    </DialogShell>
  );
}

export function ConsignmentDialog({
  suppliers,
  ...props
}: DialogBaseProps<Consignment> & {
  suppliers: Supplier[];
}) {
  const initialItems: ConsignmentItemFormRow[] =
    props.initialValues?.items?.map((item) => ({
      id: item.id,
      productNameUrdu: item.productNameUrdu,
      productNameRoman: item.productNameRoman ?? "",
      unit: item.unit ?? "",
      quantityReceived: item.quantityReceived,
      baseRate: item.baseRate ?? 0,
    })) ?? [{ productNameUrdu: "", productNameRoman: "", unit: "", quantityReceived: 0, baseRate: 0 }];

  const form = useForm<ConsignmentFormValues>({
    defaultValues: {
      supplierId: props.initialValues?.supplierId ?? "",
      vehicleNumber: props.initialValues?.vehicleNumber ?? "",
      driverName: props.initialValues?.driverName ?? "",
      driverPhone: props.initialValues?.driverPhone ?? "",
      arrivalDate: props.initialValues?.arrivalDate?.slice(0, 10) ?? todayDate(),
      notes: props.initialValues?.notes ?? "",
      commissionType: props.initialValues?.commissionType ?? "PERCENTAGE",
      commissionValue: props.initialValues?.commissionValue ?? 0,
      items: initialItems,
    },
    values: {
      supplierId: props.initialValues?.supplierId ?? "",
      vehicleNumber: props.initialValues?.vehicleNumber ?? "",
      driverName: props.initialValues?.driverName ?? "",
      driverPhone: props.initialValues?.driverPhone ?? "",
      arrivalDate: props.initialValues?.arrivalDate?.slice(0, 10) ?? todayDate(),
      notes: props.initialValues?.notes ?? "",
      commissionType: props.initialValues?.commissionType ?? "PERCENTAGE",
      commissionValue: props.initialValues?.commissionValue ?? 0,
      items: initialItems,
    },
  });

  const items = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "گاڑی میں ترمیم" : "نئی گاڑی"}
      description="ٹرک، سپلائر، کمیشن اور متعدد آئٹمز ایک ہی ریکارڈ میں درج کریں۔"
    >
      <form
        onSubmit={form.handleSubmit((values) =>
          props.onSubmit({
            ...values,
            items: values.items.map((item) => ({
              ...(item.id ? { id: item.id } : {}),
              productNameUrdu: item.productNameUrdu,
              productNameRoman: item.productNameRoman,
              unit: item.unit,
              quantityReceived: item.quantityReceived,
              baseRate: item.baseRate,
            })),
          })
        )}
        className="space-y-6"
      >
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>سپلائر</FieldLabel>
            <Controller
              control={form.control}
              name="supplierId"
              rules={{ required: "سپلائر ضروری ہے" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="سپلائر منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.supplierId]} />
          </Field>
          <Field>
            <FieldLabel>آمد تاریخ</FieldLabel>
            <Input {...form.register("arrivalDate")} type="date" />
          </Field>
          <Field>
            <FieldLabel>گاڑی نمبر</FieldLabel>
            <Input {...form.register("vehicleNumber")} placeholder="گاڑی کا نمبر" />
          </Field>
          <Field>
            <FieldLabel>ڈرائیور نام</FieldLabel>
            <Input {...form.register("driverName")} placeholder="ڈرائیور کا نام" />
          </Field>
          <Field>
            <FieldLabel>ڈرائیور فون</FieldLabel>
            <Input {...form.register("driverPhone")} placeholder="فون نمبر" />
          </Field>
          <Field>
            <FieldLabel>کمیشن طریقہ</FieldLabel>
            <Controller
              control={form.control}
              name="commissionType"
              render={({ field }) => (
                <Select value={field.value as CommissionType} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="طریقہ منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(commissionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>کمیشن ویلیو</FieldLabel>
            <Input {...form.register("commissionValue", { valueAsNumber: true })} type="number" min="0" placeholder="0" />
          </Field>
        </FieldGroup>

        <div className="space-y-4 rounded-[1.5rem] border border-[var(--brand-line)] p-4 dark:border-white/10 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-xl">آئٹمز</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">ٹرک میں موجود تمام پروڈکٹس الگ الگ درج کریں۔</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                items.append({
                  productNameUrdu: "",
                  productNameRoman: "",
                  unit: "",
                  quantityReceived: 0,
                  baseRate: 0,
                })
              }
            >
              <Plus className="size-4" />
              آئٹم شامل کریں
            </Button>
          </div>

          <div className="space-y-4">
            {items.fields.map((field, index) => (
              <div key={field.id} className="rounded-2xl border border-[var(--brand-line)] bg-[var(--surface-soft)] p-4 dark:border-white/10 dark:bg-slate-900/60">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Field className="xl:col-span-2">
                    <FieldLabel>پروڈکٹ اردو نام</FieldLabel>
                    <Input {...form.register(`items.${index}.productNameUrdu` as const)} placeholder="مثلاً آلو" />
                  </Field>
                  <Field>
                    <FieldLabel>رومن نام</FieldLabel>
                    <Input {...form.register(`items.${index}.productNameRoman` as const)} placeholder="رومن نام" dir="ltr" />
                  </Field>
                  <Field>
                    <FieldLabel>اکائی</FieldLabel>
                    <Input {...form.register(`items.${index}.unit` as const)} placeholder="بوری / کریٹ" />
                  </Field>
                  <Field>
                    <FieldLabel>موصول مقدار</FieldLabel>
                    <Input {...form.register(`items.${index}.quantityReceived` as const, { valueAsNumber: true })} type="number" min="0" />
                  </Field>
                  <Field>
                    <FieldLabel>بنیادی ریٹ</FieldLabel>
                    <Input {...form.register(`items.${index}.baseRate` as const, { valueAsNumber: true })} type="number" min="0" />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="button" variant="ghost" onClick={() => items.remove(index)} disabled={items.fields.length === 1}>
                    <Trash2 className="size-4" />
                    حذف کریں
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Field>
          <FieldLabel>نوٹ</FieldLabel>
          <textarea
            {...form.register("notes")}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 dark:bg-slate-900/50 dark:text-white"
            placeholder="عملی صورتحال، وزن، یا کسی خاص ہدایت کا نوٹ"
          />
        </Field>

        <FormActions loading={props.loading} submitLabel="گاڑی محفوظ کریں" />
      </form>
    </DialogShell>
  );
}

type SaleDialogLineItem = {
  consignmentId: string;
  consignmentItemId: string;
  productNameUrdu: string;
  quantity: number;
  rate: number;
};

type SaleDialogValues = {
  id?: string;
  customerId: string;
  saleDate: string;
  notes?: string;
  items: SaleDialogLineItem[];
};

export function SaleDialog({
  customers,
  consignments,
  ...props
}: DialogBaseProps<SaleDialogValues> & {
  customers: Customer[];
  consignments: Consignment[];
}) {
  const form = useForm<SaleDialogValues>({
    defaultValues: {
      customerId: props.initialValues?.customerId ?? "",
      saleDate: props.initialValues?.saleDate?.slice(0, 10) ?? todayDate(),
      notes: props.initialValues?.notes ?? "",
      items:
        props.initialValues?.items?.map((item) => ({
          consignmentId: item.consignmentId,
          consignmentItemId: item.consignmentItemId,
          productNameUrdu: item.productNameUrdu,
          quantity: item.quantity,
          rate: item.rate,
        })) ?? [{ consignmentId: "", consignmentItemId: "", productNameUrdu: "", quantity: 0, rate: 0 }],
    },
    values: {
      customerId: props.initialValues?.customerId ?? "",
      saleDate: props.initialValues?.saleDate?.slice(0, 10) ?? todayDate(),
      notes: props.initialValues?.notes ?? "",
      items:
        props.initialValues?.items?.map((item) => ({
          consignmentId: item.consignmentId,
          consignmentItemId: item.consignmentItemId,
          productNameUrdu: item.productNameUrdu,
          quantity: item.quantity,
          rate: item.rate,
        })) ?? [{ consignmentId: "", consignmentItemId: "", productNameUrdu: "", quantity: 0, rate: 0 }],
    },
  });

  const items = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchedItems = form.watch("items");

  const total = useMemo(
    () =>
      watchedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0),
    [watchedItems],
  );

  return (
    <DialogShell
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.initialValues?.id ? "فروخت میں ترمیم" : "نئی فروخت"}
      description="فروخت گاہک کے کھاتے میں ڈیبٹ پیدا کرتی ہے، اس لئے آئٹمز اور ریٹ غور سے درج کریں۔"
    >
      <form
        onSubmit={form.handleSubmit((values) => {
          const payload = {
            ...values,
            items: values.items.map((item) => ({
              ...item,
              productNameUrdu:
                item.productNameUrdu ||
                consignments
                  .find((consignment) => consignment.id === item.consignmentId)
                  ?.items.find((entry) => entry.id === item.consignmentItemId)?.productNameUrdu ||
                "",
            })),
          };
          props.onSubmit(payload);
        })}
        className="space-y-6"
      >
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>گاہک</FieldLabel>
            <Controller
              control={form.control}
              name="customerId"
              rules={{ required: "گاہک ضروری ہے" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="گاہک منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>فروخت تاریخ</FieldLabel>
            <Input {...form.register("saleDate")} type="date" />
          </Field>
        </FieldGroup>

        <div className="space-y-4 rounded-[1.5rem] border border-[var(--brand-line)] p-4 dark:border-white/10 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-xl">فروخت آئٹمز</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">گاڑی سے آئٹم منتخب کریں، مقدار اور ریٹ درج کریں۔</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                items.append({
                  consignmentId: "",
                  consignmentItemId: "",
                  productNameUrdu: "",
                  quantity: 0,
                  rate: 0,
                })
              }
            >
              <Plus className="size-4" />
              لائن شامل کریں
            </Button>
          </div>

          <div className="space-y-4">
            {items.fields.map((field, index) => {
              const consignmentId = form.watch(`items.${index}.consignmentId`);
              const relatedItems =
                consignments.find((consignment) => consignment.id === consignmentId)?.items ?? [];
              const quantity = Number(form.watch(`items.${index}.quantity`) || 0);
              const rate = Number(form.watch(`items.${index}.rate`) || 0);

              return (
                <div key={field.id} className="rounded-2xl border border-[var(--brand-line)] bg-[var(--surface-soft)] p-4 dark:border-white/10 dark:bg-slate-900/60">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Field>
                      <FieldLabel>گاڑی</FieldLabel>
                      <Controller
                        control={form.control}
                        name={`items.${index}.consignmentId`}
                        render={({ field: selectField }) => (
                          <Select
                            value={selectField.value}
                            onValueChange={(value) => {
                              selectField.onChange(value);
                              form.setValue(`items.${index}.consignmentItemId`, "");
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="گاڑی منتخب کریں" />
                            </SelectTrigger>
                            <SelectContent>
                              {consignments.map((consignment) => (
                                <SelectItem key={consignment.id} value={consignment.id}>
                                  {consignment.supplier?.name ?? "سپلائر"} - {consignment.vehicleNumber || "بغیر نمبر"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>آئٹم</FieldLabel>
                      <Controller
                        control={form.control}
                        name={`items.${index}.consignmentItemId`}
                        render={({ field: selectField }) => (
                          <Select
                            value={selectField.value}
                            onValueChange={(value) => {
                              selectField.onChange(value);
                              const selected = relatedItems.find((item) => item.id === value);
                              form.setValue(`items.${index}.productNameUrdu`, selected?.productNameUrdu ?? "");
                              if (!form.getValues(`items.${index}.rate`)) {
                                form.setValue(`items.${index}.rate`, selected?.baseRate ?? 0);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="آئٹم منتخب کریں" />
                            </SelectTrigger>
                            <SelectContent>
                              {relatedItems
                                .filter((item) => item.id)
                                .map((item) => (
                                  <SelectItem key={item.id} value={item.id!}>
                                    {item.productNameUrdu}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>مقدار</FieldLabel>
                      <Input {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" min="0" />
                    </Field>
                    <Field>
                      <FieldLabel>ریٹ</FieldLabel>
                      <Input {...form.register(`items.${index}.rate`, { valueAsNumber: true })} type="number" min="0" />
                    </Field>
                    <Field>
                      <FieldLabel>لائن کل</FieldLabel>
                      <div className="flex h-10 items-center rounded-md border border-input bg-white px-3 text-sm font-semibold dark:bg-slate-900/70 dark:text-white">
                        {formatCurrency(quantity * rate)}
                      </div>
                    </Field>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button type="button" variant="ghost" onClick={() => items.remove(index)} disabled={items.fields.length === 1}>
                      <Trash2 className="size-4" />
                      حذف کریں
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--brand-line)] bg-[var(--surface-soft)] p-4 dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-300">مجموعی فروخت</p>
            <p className="font-heading text-3xl text-slate-950 dark:text-white">{formatCurrency(total)}</p>
          </div>
        </div>

        <Field>
          <FieldLabel>نوٹ</FieldLabel>
          <textarea
            {...form.register("notes")}
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 dark:bg-slate-900/50 dark:text-white"
            placeholder="کسی خاص رعایت یا نوٹ"
          />
        </Field>
        <FormActions loading={props.loading} submitLabel="فروخت محفوظ کریں" />
      </form>
    </DialogShell>
  );
}
