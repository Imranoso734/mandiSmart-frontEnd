import dynamic from "next/dynamic";

const ConsignmentDetailPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.ConsignmentDetailPageClient),
  { loading: () => null },
);

export default async function ConsignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ConsignmentDetailPageClient id={resolvedParams.id} />;
}
