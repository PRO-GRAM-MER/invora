"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type Props = {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
};

export function AppShell({ children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  const name = user.name ?? "User";
  const email = user.email ?? "";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-full overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} userName={name} userEmail={email} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
