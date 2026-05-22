import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed, className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5 group', className)}>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-vedaai-500 to-vedaai-700 flex items-center justify-center shadow-md glow-sm group-hover:scale-105 transition-transform duration-200">
        <span className="text-white font-bold text-lg">V</span>
      </div>
      {!collapsed && <span className="text-lg font-bold tracking-tight gradient-text">VedaAI</span>}
    </Link>
  );
}
