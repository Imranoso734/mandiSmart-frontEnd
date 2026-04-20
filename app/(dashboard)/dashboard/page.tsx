import dynamic from "next/dynamic";

const DashboardPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.DashboardPageClient),
  { loading: () => null },
);

export default function Page() {
  return <DashboardPageClient />;
}
