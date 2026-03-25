import { SupplierDetailPageClient } from "@/components/mandi/pages";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupplierDetailPageClient id={id} />;
}
