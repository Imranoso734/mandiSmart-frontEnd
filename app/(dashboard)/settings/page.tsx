import dynamic from "next/dynamic";

const SettingsPageClient = dynamic(
  () => import("@/components/mandi/pages").then((module) => module.SettingsPageClient),
  { loading: () => null },
);

export default function Page() {
  return <SettingsPageClient />;
}
