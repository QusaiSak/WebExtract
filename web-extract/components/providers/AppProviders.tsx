"use client";

import { ThemeProvider } from "next-themes";
import React, { useState } from "react";
import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import NextTopLoader from "nextjs-toploader";
import { SidebarProvider } from "../ui/sidebar";

function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClinet] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClinet}>
      <SidebarProvider>
      <NextTopLoader color="#3F00FF" showSpinner={false} />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
