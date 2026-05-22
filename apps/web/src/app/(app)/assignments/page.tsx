'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FilePlus2, Search, ArrowRight, Eye, Calendar, Award, BookOpen, Layers } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, StatusBadge } from '@/components/shared';
import { useAssignments } from '@/hooks/use-assignments';

export default function AssignmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useAssignments(page, 10);

  const assignments = data?.assignments || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const filteredAssignments = assignments.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header
        title="Assignments"
        description="Manage your generated question papers and track active AI processing."
      />
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments by title, subject or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/assignments/new">
            <Button variant="gradient" className="w-full sm:w-auto">
              <FilePlus2 className="w-4 h-4 mr-2" /> New Assignment
            </Button>
          </Link>
        </div>

        {/* Assignments Display */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse border-border/40">
                <CardContent className="h-40" />
              </Card>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={searchTerm ? 'No search results' : 'No assignments created yet'}
            description={
              searchTerm
                ? 'Try adjusting your search terms or keywords.'
                : 'Get started by creating your very first AI-generated question paper.'
            }
            action={
              searchTerm
                ? undefined
                : {
                    label: 'Create Assignment',
                    onClick: () => router.push('/assignments/new'),
                  }
            }
            className="glass-card rounded-2xl border border-border/30"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((assignment) => {
              const totalMarks = assignment.numberOfQuestions * assignment.marksPerQuestion;
              return (
                <Card
                  key={assignment._id}
                  className="glass-card hover:border-vedaai-500/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      assignment.status === 'completed'
                        ? 'bg-emerald-500'
                        : assignment.status === 'failed'
                        ? 'bg-destructive'
                        : 'bg-gradient-to-b from-vedaai-600 to-vedaai-400'
                    }`}
                  />
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg leading-tight group-hover:text-vedaai-400 transition-colors">
                          {assignment.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 items-center mt-1">
                          {assignment.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {assignment.subject}
                            </Badge>
                          )}
                          {assignment.grade && (
                            <Badge variant="outline" className="text-xs">
                              {assignment.grade}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={assignment.status} className="shrink-0" />
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-border/30 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                          Questions
                        </span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-vedaai-500/70" />
                          {assignment.numberOfQuestions}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                          Total Marks
                        </span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-vedaai-500/70" />
                          {totalMarks}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                          Due Date
                        </span>
                        <span className="font-medium text-foreground flex items-center gap-1 truncate">
                          <Calendar className="w-3.5 h-3.5 text-vedaai-500/70" />
                          {new Date(assignment.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row / Action */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground/60">
                        Created {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                      {assignment.status === 'completed' && assignment.generatedPaperId ? (
                        <Link href={`/results/${assignment.generatedPaperId}`}>
                          <Button size="sm" variant="gradient" className="h-8">
                            View Paper <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/assignments/${assignment._id}`}>
                          <Button size="sm" variant="outline" className="h-8">
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Progress
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
