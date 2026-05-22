'use client';

import { useParams } from 'next/navigation';
import { Download, RefreshCw, Copy, Printer, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useResult, useRegenerateResult } from '@/hooks/use-assignments';
import { useAssignmentSocket } from '@/hooks/use-socket';
import { apiClient } from '@/services/api';

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, refetch } = useResult(id);
  const regenerate = useRegenerateResult();
  useAssignmentSocket(data?.assignment?._id || null);

  const paper = data?.paper;
  const assignment = data?.assignment;

  const handleDownloadPDF = async () => {
    try {
      toast.info('Generating PDF...');
      const response = await apiClient.get(`/results/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paper?.title || 'question-paper'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('PDF generation failed');
    }
  };

  const handleCopy = () => {
    if (!paper) return;
    const text = paper.sections.map((s) =>
      `${s.title}\n${s.instruction}\n\n${s.questions.map((q, i) => `${i + 1}. ${q.question} [${q.marks} marks] (${q.difficulty})`).join('\n')}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <>
        <Header title="Generated Paper" />
        <div className="p-6 space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!paper) {
    return (
      <>
        <Header title="Generated Paper" />
        <div className="p-6 text-center text-muted-foreground py-20">Paper not found</div>
      </>
    );
  }

  return (
    <>
      <Header title="Generated Paper" description={paper.title} />
      <div className="p-6 max-w-4xl mx-auto space-y-6 pb-16">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-vedaai-400" />
            <span className="text-sm text-muted-foreground">
              {paper.sections.reduce((a, s) => a + s.questions.length, 0)} questions · {paper.totalMarks} marks
              {paper.duration && ` · ${paper.duration}`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="w-4 h-4 mr-1.5" />Copy</Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}><Download className="w-4 h-4 mr-1.5" />PDF</Button>
            <Button variant="outline" size="sm" onClick={() => regenerate.mutate(id)} loading={regenerate.isPending}><RefreshCw className="w-4 h-4 mr-1.5" />Regenerate</Button>
          </div>
        </div>

        {/* Exam Paper */}
        <Card className="glass-card print:shadow-none print:border" id="exam-paper">
          {/* Header */}
          <CardHeader className="text-center border-b border-border/50 pb-6">
            <CardTitle className="text-2xl font-bold">{paper.title}</CardTitle>
            {assignment?.subject && <p className="text-sm text-muted-foreground mt-1">Subject: {assignment.subject}</p>}
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>Total Marks: <strong className="text-foreground">{paper.totalMarks}</strong></span>
              {paper.duration && <span>Duration: <strong className="text-foreground">{paper.duration}</strong></span>}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-2">
            {/* Student Info */}
            <div className="border border-border/50 rounded-lg p-4 space-y-3 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground min-w-[80px]">Name:</span>
                  <div className="flex-1 border-b border-dashed border-border" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground min-w-[80px]">Roll No:</span>
                  <div className="flex-1 border-b border-dashed border-border" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground min-w-[80px]">Section:</span>
                  <div className="flex-1 border-b border-dashed border-border" />
                </div>
              </div>
            </div>

            {/* General Instructions */}
            {paper.instructions && (
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold mb-1">General Instructions:</h3>
                <p className="text-sm text-muted-foreground">{paper.instructions}</p>
              </div>
            )}

            {/* Sections */}
            {paper.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                {sIdx > 0 && <Separator className="my-6" />}
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  <p className="text-sm text-muted-foreground italic">{section.instruction}</p>
                </div>

                <div className="space-y-4 pl-1">
                  {section.questions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="group p-3 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-muted-foreground min-w-[28px] pt-0.5">
                          Q{qIdx + 1}.
                        </span>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm leading-relaxed">{q.question}</p>

                          {/* MCQ Options */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-medium">{String.fromCharCode(97 + oIdx)})</span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge variant={q.difficulty as 'easy' | 'medium' | 'hard'}>{q.difficulty}</Badge>
                            <span className="text-xs text-muted-foreground">[{q.marks} marks]</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
