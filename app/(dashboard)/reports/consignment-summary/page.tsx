import dynamic from "next/dynamic";

const ConsignmentSummaryReportPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.ConsignmentSummaryReportPageClient),
  { loading: () => null },
);

export default async function ConsignmentSummaryReportPage({
  searchParams,
}: {
  searchParams: Promise<{ consignmentId?: string }>;
}) {
  const { consignmentId } = await searchParams;
  return <ConsignmentSummaryReportPageClient consignmentId={consignmentId} />;
}
