import dynamic from "next/dynamic";

const DailySalesReportPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.DailySalesReportPageClient),
  { loading: () => null },
);

export default function Page() {
  return <DailySalesReportPageClient />;
}
