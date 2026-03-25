"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "nprogress/nprogress.css";
import ProgressBarProvider from "@/components/layout/ProgressBarProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <ProgressBarProvider>
          {children}
          <Toaster />
        </ProgressBarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
