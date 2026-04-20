import dynamic from "next/dynamic";

const CustomersPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.CustomersPageClient),
  { loading: () => null },
);

export default function Page() {
  return <CustomersPageClient />;
}
