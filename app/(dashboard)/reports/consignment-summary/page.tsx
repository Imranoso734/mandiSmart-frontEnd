import { ConsignmentSummaryReportPageClient } from "@/components/mandi/pages";

export default async function ConsignmentSummaryReportPage({
  searchParams,
}: {
  searchParams: Promise<{ consignmentId?: string }>;
}) {
  const { consignmentId } = await searchParams;
  return <ConsignmentSummaryReportPageClient consignmentId={consignmentId} />;
}
