'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
      <div>
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assignments..." className="w-64 pl-9 h-9 bg-secondary/50" />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-vedaai-500 animate-pulse" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-vedaai-500 to-vedaai-700 flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:scale-105 transition-transform">T</div>
      </div>
    </header>
  );
}
