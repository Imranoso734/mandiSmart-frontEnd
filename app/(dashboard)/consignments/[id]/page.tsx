import { ConsignmentDetailPageClient } from "@/components/mandi/pages";

export default async function ConsignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConsignmentDetailPageClient id={id} />;
}
