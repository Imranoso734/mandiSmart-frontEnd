import dynamic from "next/dynamic";

const ExpensesPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.ExpensesPageClient),
  { loading: () => null },
);

export default function Page() {
  return <ExpensesPageClient />;
}
