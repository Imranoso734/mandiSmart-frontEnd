import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { appName } from "@/lib/mandi/constants";

export const metadata: Metadata = {
  title: appName,
  description: "Urdu-first mandi management and ledger frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
