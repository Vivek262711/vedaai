'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Clock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssignment, useGenerateAssignment } from '@/hooks/use-assignments';
import { useAssignmentSocket } from '@/hooks/use-socket';
import { useSocketStore } from '@/store/socket-store';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: assignment, isLoading } = useAssignment(id);
  useAssignmentSocket(id);
  const jobState = useSocketStore((s) => s.jobStates[id]);
  const generateMutation = useGenerateAssignment();

  const currentStatus = jobState?.status || assignment?.status || 'pending';
  const progress = jobState?.progress || 0;

  useEffect(() => {
    if (jobState?.status === 'completed' && jobState?.paperId) {
      const timer = setTimeout(() => {
        router.push(`/results/${jobState.paperId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [jobState, router]);

  if (isLoading) {
    return (
      <>
        <Header title="Assignment Detail" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={assignment?.title || 'Assignment'} description="Track your AI generation progress in real-time." />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        <Card className="glass-card overflow-hidden">
          <div className={`h-1 ${currentStatus === 'completed' ? 'bg-emerald-500' : currentStatus === 'failed' ? 'bg-destructive' : 'bg-gradient-to-r from-vedaai-600 to-vedaai-400'}`} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generation Status</CardTitle>
              <StatusBadge status={currentStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(currentStatus === 'processing' || currentStatus === 'queued') && (
              <>
                <Progress value={progress} variant="gradient" className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{jobState?.message || 'Waiting...'}</span>
                  <span className="font-mono text-vedaai-400">{progress}%</span>
                </div>
              </>
            )}

            {currentStatus === 'completed' && (
              <div className="flex flex-col items-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">Question Paper Generated!</p>
                  <p className="text-sm text-muted-foreground">Redirecting to results...</p>
                </div>
                <Button variant="gradient" onClick={() => router.push(`/results/${jobState?.paperId || assignment?.generatedPaperId}`)}>
                  View Paper <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {currentStatus === 'failed' && (
              <div className="flex flex-col items-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-sm text-destructive/80">{jobState?.error || assignment?.error || 'An unexpected error occurred'}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => generateMutation.mutate(id)}
                  loading={generateMutation.isPending}
                >
                  Try Again
                </Button>
              </div>
            )}

            {currentStatus === 'pending' && (
              <div className="flex flex-col items-center py-6 space-y-3">
                <Clock className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Waiting for generation to start...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Info */}
        {assignment && (
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Assignment Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {assignment.subject && <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium ml-1">{assignment.subject}</span></div>}
                {assignment.grade && <div><span className="text-muted-foreground">Grade:</span> <span className="font-medium ml-1">{assignment.grade}</span></div>}
                <div><span className="text-muted-foreground">Questions:</span> <span className="font-medium ml-1">{assignment.numberOfQuestions}</span></div>
                <div><span className="text-muted-foreground">Marks each:</span> <span className="font-medium ml-1">{assignment.marksPerQuestion}</span></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {assignment.questionTypes?.map((t: string) => <Badge key={t} variant="info">{t.replace(/_/g, ' ')}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
