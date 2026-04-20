import dynamic from "next/dynamic";

const PaymentsPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.PaymentsPageClient),
  { loading: () => null },
);

export default function Page() {
  return <PaymentsPageClient />;
}
