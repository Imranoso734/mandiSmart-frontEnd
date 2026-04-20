import dynamic from "next/dynamic";

const ConsignmentsPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.ConsignmentsPageClient),
  { loading: () => null },
);

export default function Page() {
  return <ConsignmentsPageClient />;
}
