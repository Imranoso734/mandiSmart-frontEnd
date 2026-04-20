import dynamic from "next/dynamic";

const CustomerDetailPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.CustomerDetailPageClient),
  { loading: () => null },
);

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <CustomerDetailPageClient id={resolvedParams.id} />;
}
