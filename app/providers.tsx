"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import "nprogress/nprogress.css";
import { ThemeProvider } from "next-themes";

const ProgressBarProvider = dynamic(() => import("@/components/layout/ProgressBarProvider"), {
  ssr: false,
});
const GlobalApiLoader = dynamic(
  () => import("@/components/mandi/ui").then((module) => module.GlobalApiLoader),
  { ssr: false },
);
const Toaster = dynamic(() => import("@/components/ui/sonner").then((module) => module.Toaster), {
  ssr: false,
});

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <ProgressBarProvider>
          {children}
          <GlobalApiLoader />
          <Toaster />
        </ProgressBarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
