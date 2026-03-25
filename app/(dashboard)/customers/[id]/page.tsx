import { CustomerDetailPageClient } from "@/components/mandi/pages";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailPageClient id={id} />;
}
