'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FilePlus2, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New', href: '/assignments/new', icon: FilePlus2 },
  { name: 'Assignments', href: '/assignments', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex h-16 items-center justify-around border-t border-border/50 bg-card/85 backdrop-blur-xl px-4 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      {navigation.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all duration-200 relative',
              isActive ? 'text-vedaai-400 font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className={cn('h-5.5 w-5.5 transition-transform duration-200', isActive && 'scale-110 text-vedaai-400')} />
            <span className="text-[10px] tracking-tight">{item.name}</span>
            {isActive && (
              <span className="absolute -top-1 w-8 h-[3px] rounded-full bg-gradient-to-r from-vedaai-400 to-vedaai-600 shadow-[0_2px_10px_rgba(99,102,241,0.5)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
