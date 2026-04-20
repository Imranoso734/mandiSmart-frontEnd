import dynamic from "next/dynamic";

const CustomerLedgerReportPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.CustomerLedgerReportPageClient),
  { loading: () => null },
);

export default async function CustomerLedgerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  return <CustomerLedgerReportPageClient customerId={customerId} />;
}
