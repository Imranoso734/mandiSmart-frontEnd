import dynamic from "next/dynamic";

const UsersPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.UsersPageClient),
  { loading: () => null },
);

export default function Page() {
  return <UsersPageClient />;
}
