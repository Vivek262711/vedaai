'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FilePlus2, FileText, Clock, TrendingUp, ArrowRight, Eye, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared';
import { useAssignments } from '@/hooks/use-assignments';

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useAssignments(1, 10);

  const assignments = data?.assignments || [];
  const totalAssignments = data?.total || 0;
  
  const completedPapers = assignments.filter((a) => a.status === 'completed').length;
  const pendingPapers = assignments.filter((a) => ['pending', 'queued', 'processing'].includes(a.status)).length;

  const stats = [
    { 
      title: 'Total Assignments', 
      value: isLoading ? '...' : String(totalAssignments), 
      icon: FileText, 
      color: 'text-vedaai-400',
      bgColor: 'bg-vedaai-500/10'
    },
    { 
      title: 'Generated Papers', 
      value: isLoading ? '...' : String(completedPapers), 
      icon: TrendingUp, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    { 
      title: 'Pending Generation', 
      value: isLoading ? '...' : String(pendingPapers), 
      icon: Clock, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
  ];

  return (
    <>
      <Header title="Dashboard" description="Welcome back! Here's your assessment overview." />
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="glass-card hover:border-vedaai-500/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1.5">Active resources in workspace</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="space-y-4">
            <Card className="animate-pulse h-48 border-border/40" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-vedaai-500/10 flex items-center justify-center mb-4">
                <FilePlus2 className="w-8 h-8 text-vedaai-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Create Your First Assessment</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Set up assignment parameters and let AI generate a professional question paper in seconds.
              </p>
              <Link href="/assignments/new">
                <Button variant="gradient" size="lg">
                  <FilePlus2 className="w-4 h-4 mr-2" /> Create Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Assignments Table/List */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Assignments</CardTitle>
                  <CardDescription>Latest generated papers and operations</CardDescription>
                </div>
                <Link href="/assignments">
                  <Button variant="ghost" size="sm" className="text-vedaai-400 hover:text-vedaai-300">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {assignments.slice(0, 5).map((assignment) => (
                    <div key={assignment._id} className="flex items-center justify-between p-4 hover:bg-card/30 transition-colors">
                      <div className="space-y-1 pr-4 min-w-0">
                        <p className="font-medium text-sm truncate">{assignment.title}</p>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {assignment.subject && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {assignment.subject}
                            </Badge>
                          )}
                          {assignment.grade && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {assignment.grade}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={assignment.status} className="text-[10px] py-0" />
                        {assignment.status === 'completed' && assignment.generatedPaperId ? (
                          <Link href={`/results/${assignment.generatedPaperId}`}>
                            <Button size="sm" variant="gradient" className="h-8 w-8 p-0 rounded-full">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/assignments/${assignment._id}`}>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions / Getting Started */}
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Quick Start</CardTitle>
                  <CardDescription>Launch resources instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/assignments/new" className="block">
                    <Button variant="gradient" className="w-full justify-start">
                      <FilePlus2 className="w-4 h-4 mr-2" /> New Assignment Paper
                    </Button>
                  </Link>
                  <Link href="/assignments" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" /> View Paper Archives
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">AI Assistant Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <div className="flex gap-2">
                    <Award className="w-4 h-4 text-vedaai-400 shrink-0 mt-0.5" />
                    <p>Provide specific and detailed extra instructions (e.g. "focus on equations") to direct the AI topic relevance.</p>
                  </div>
                  <div className="flex gap-2">
                    <TrendingUp className="w-4 h-4 text-vedaai-400 shrink-0 mt-0.5" />
                    <p>To reduce credits consumption during testing, set model to `gpt-4o-mini` in the backend environment variables.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
