'use client';

import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useSocket } from '@/hooks';

export function AppShell({ children }: { children: React.ReactNode }) {
  useSocket();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-0 md:pl-[240px] pb-16 md:pb-0 transition-all duration-300">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
