import dynamic from "next/dynamic";

const SalesPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.SalesPageClient),
  { loading: () => null },
);

export default function Page() {
  return <SalesPageClient />;
}
