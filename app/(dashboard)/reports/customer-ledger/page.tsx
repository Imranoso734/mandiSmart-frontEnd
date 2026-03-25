import { CustomerLedgerReportPageClient } from "@/components/mandi/pages";

export default async function CustomerLedgerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  return <CustomerLedgerReportPageClient customerId={customerId} />;
}
