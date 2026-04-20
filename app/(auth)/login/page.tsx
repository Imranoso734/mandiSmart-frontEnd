import dynamic from "next/dynamic";

const LoginPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.LoginPageClient),
  { loading: () => null },
);

export default function Page() {
  return <LoginPageClient />;
}
