import dynamic from "next/dynamic";

const ReportsIndexPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.ReportsIndexPageClient),
  { loading: () => null },
);

export default function Page() {
  return <ReportsIndexPageClient />;
}
