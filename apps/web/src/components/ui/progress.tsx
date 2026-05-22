'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger';
}

const variantStyles: Record<string, string> = {
  default: 'bg-primary',
  gradient: 'bg-gradient-to-r from-vedaai-600 to-vedaai-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    return (
      <div ref={ref} className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} {...props}>
        <div className={cn('h-full rounded-full transition-all duration-500 ease-out', variantStyles[variant])} style={{ width: `${percentage}%` }} />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
