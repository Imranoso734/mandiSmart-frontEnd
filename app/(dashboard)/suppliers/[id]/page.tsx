import dynamic from "next/dynamic";

const SupplierDetailPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.SupplierDetailPageClient),
  { loading: () => null },
);

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <SupplierDetailPageClient id={resolvedParams.id} />;
}
