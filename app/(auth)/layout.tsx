import { ThemeToggle } from "@/components/mandi/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[linear-gradient(135deg,#fff7ea_0%,#f3efe4_45%,#e6f2eb_100%)] dark:bg-[linear-gradient(135deg,#08111b_0%,#0b1824_45%,#0f2430_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="absolute left-4 top-4 z-20">
          <ThemeToggle />
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[2.5rem] border border-white/70 bg-[linear-gradient(160deg,rgba(14,78,60,0.95),rgba(11,53,41,0.97))] p-10 text-white shadow-[0_40px_90px_-45px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(9,61,47,0.96),rgba(8,17,27,0.96))]">
            <p className="font-heading text-5xl">منڈی اسمارٹ</p>
            <h2 className="mt-6 font-heading text-4xl leading-[1.8]">
              منڈی کا روزانہ حساب اب ایک صاف، واضح اور قابلِ اعتماد جگہ پر
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-8 text-white/78">
              فروخت، وصولی، خرچے، مال والی گاڑی اور حساب کو اردو میں اس انداز سے سنبھالیں کہ مالک بھی سمجھ سکے اور مشی بھی جلدی کام کر سکے۔
            </p>

            <div className="mt-10 grid gap-4">
              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5">
                <p className="text-sm text-white/70">فروخت = ڈیبٹ</p>
                <p className="mt-2 font-heading text-3xl">گاہک کا کھاتہ فوراً بڑھے گا</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5">
                <p className="text-sm text-white/70">وصولی = کریڈٹ</p>
                <p className="mt-2 font-heading text-3xl">چلتا بیلنس واضح رہے گا</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
