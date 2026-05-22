import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  queued: { label: 'Queued', variant: 'info', icon: Zap },
  processing: { label: 'Processing', variant: 'warning', icon: Loader2 },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant as any} className={className}>
      <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
