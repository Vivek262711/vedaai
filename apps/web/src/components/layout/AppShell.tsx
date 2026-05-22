'use client';

import { Sidebar } from './Sidebar';
import { useSocket } from '@/hooks';

export function AppShell({ children }: { children: React.ReactNode }) {
  useSocket();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-[240px] transition-all duration-300">{children}</main>
    </div>
  );
}
