'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30 * 1000, retry: 2, refetchOnWindowFocus: false },
        mutations: { retry: 1 },
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" toastOptions={{ className: 'bg-card border-border text-foreground', duration: 4000 }} richColors closeButton />
    </QueryClientProvider>
  );
}
