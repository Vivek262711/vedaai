'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FilePlus2, FileText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Assignment', href: '/assignments/new', icon: FilePlus2 },
  { name: 'Assignments', href: '/assignments', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn('fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300', collapsed ? 'w-[68px]' : 'w-[240px]')}>
        <div className="flex h-16 items-center px-4 border-b border-border/50">
          <Logo collapsed={collapsed} />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const linkEl = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive ? 'bg-vedaai-500/15 text-vedaai-400 shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  collapsed && 'justify-center px-2',
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-vedaai-400' : 'text-muted-foreground group-hover:text-foreground')} />
                {!collapsed && <span>{item.name}</span>}
                {isActive && <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-vedaai-500" />}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.name}>{linkEl}</div>;
          })}
        </nav>

        <div className="p-3 border-t border-border/50">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" /><span className="text-sm">Collapse</span></>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
