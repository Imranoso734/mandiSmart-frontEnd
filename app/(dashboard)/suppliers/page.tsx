import dynamic from "next/dynamic";

const SuppliersPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.SuppliersPageClient),
  { loading: () => null },
);

export default function Page() {
  return <SuppliersPageClient />;
}
