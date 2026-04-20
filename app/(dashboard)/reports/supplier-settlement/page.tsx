import dynamic from "next/dynamic";

const SupplierSettlementReportPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.SupplierSettlementReportPageClient),
  { loading: () => null },
);

export default async function SupplierSettlementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ consignmentId?: string }>;
}) {
  const { consignmentId } = await searchParams;
  return <SupplierSettlementReportPageClient consignmentId={consignmentId} />;
}
