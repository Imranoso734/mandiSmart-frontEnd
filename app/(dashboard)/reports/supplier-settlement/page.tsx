import { SupplierSettlementReportPageClient } from "@/components/mandi/pages";

export default async function SupplierSettlementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ consignmentId?: string }>;
}) {
  const { consignmentId } = await searchParams;
  return <SupplierSettlementReportPageClient consignmentId={consignmentId} />;
}
