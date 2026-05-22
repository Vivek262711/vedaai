'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { CalendarDays, FileUp, Sparkles, X, BookOpen, Hash, Award, BarChart3, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useAssignmentStore } from '@/store/assignment-store';
import { useCreateAssignment, useGenerateAssignment } from '@/hooks/use-assignments';

const questionTypeOptions = [
  { value: 'mcq', label: 'Multiple Choice', icon: '🔘' },
  { value: 'short_answer', label: 'Short Answer', icon: '📝' },
  { value: 'long_answer', label: 'Long Answer', icon: '📄' },
  { value: 'true_false', label: 'True/False', icon: '✅' },
  { value: 'fill_in_blank', label: 'Fill in Blank', icon: '✏️' },
];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().optional(),
  grade: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required').refine((val) => new Date(val) >= new Date(new Date().toDateString()), 'Due date cannot be in the past'),
  questionTypes: z.array(z.string()).min(1, 'Select at least one question type'),
  numberOfQuestions: z.coerce.number().int().min(1, 'Min 1').max(100, 'Max 100'),
  marksPerQuestion: z.coerce.number().int().min(1, 'Min 1').max(50, 'Max 50'),
  difficultyDistribution: z.object({
    easy: z.coerce.number().min(0).max(100),
    medium: z.coerce.number().min(0).max(100),
    hard: z.coerce.number().min(0).max(100),
  }).refine((v) => v.easy + v.medium + v.hard === 100, 'Must sum to 100%'),
  instructions: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AssignmentForm() {
  const router = useRouter();
  const { draft, setDraft, resetDraft } = useAssignmentStore();
  const createMutation = useCreateAssignment();
  const generateMutation = useGenerateAssignment();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: draft.title,
      subject: draft.subject,
      grade: draft.grade,
      dueDate: draft.dueDate,
      questionTypes: draft.questionTypes,
      numberOfQuestions: draft.numberOfQuestions,
      marksPerQuestion: draft.marksPerQuestion,
      difficultyDistribution: draft.difficultyDistribution,
      instructions: draft.instructions,
    },
  });

  const watchedTypes = watch('questionTypes');
  const watchedDifficulty = watch('difficultyDistribution');
  const fileState = useAssignmentStore((s) => s.draft.file);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setDraft({ file: accepted[0] });
      toast.success(`File attached: ${accepted[0].name}`);
    }
  }, [setDraft]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const toggleType = (type: string) => {
    const current = watchedTypes || [];
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    setValue('questionTypes', next, { shouldValidate: true });
  };

  const updateDifficulty = (key: 'easy' | 'medium' | 'hard', value: number) => {
    const current = { ...watchedDifficulty };
    const oldVal = current[key];
    const diff = value - oldVal;
    current[key] = value;

    const otherKeys = (['easy', 'medium', 'hard'] as const).filter((k) => k !== key);
    const otherTotal = otherKeys.reduce((sum, k) => sum + current[k], 0);
    if (otherTotal > 0) {
      otherKeys.forEach((k) => {
        current[k] = Math.max(0, Math.round(current[k] - (diff * current[k]) / otherTotal));
      });
    }
    const total = current.easy + current.medium + current.hard;
    if (total !== 100) current[otherKeys[0]] += 100 - total;

    setValue('difficultyDistribution', current, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'difficultyDistribution' || key === 'questionTypes') {
          formData.append(key, JSON.stringify(val));
        } else if (val !== undefined && val !== '') {
          formData.append(key, String(val));
        }
      });
      if (fileState) formData.append('file', fileState);

      const result = await createMutation.mutateAsync(formData);
      const assignmentId = result.assignment._id;

      await generateMutation.mutateAsync(assignmentId);
      resetDraft();
      router.push(`/assignments/${assignmentId}`);
    } catch {
      toast.error('Failed to create assignment');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      {/* Basic Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-vedaai-400" />Basic Information</CardTitle>
          <CardDescription>Set up the core assignment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Assignment Title *</Label>
            <Input id="title" placeholder="e.g. Mid-Term Physics Examination" {...register('title')} error={!!errors.title} className="mt-1.5" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g. Physics" {...register('subject')} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="grade">Grade / Class</Label>
              <Input id="grade" placeholder="e.g. Grade 10" {...register('grade')} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <div className="relative mt-1.5">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="dueDate" type="date" {...register('dueDate')} error={!!errors.dueDate} className="pl-10" />
            </div>
            {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Question Types */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hash className="w-5 h-5 text-vedaai-400" />Question Configuration</CardTitle>
          <CardDescription>Choose question types and quantity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Question Types *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {questionTypeOptions.map((opt) => (
                <button key={opt.value} type="button" onClick={() => toggleType(opt.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${watchedTypes?.includes(opt.value) ? 'border-vedaai-500 bg-vedaai-500/15 text-vedaai-400' : 'border-border hover:border-vedaai-500/50 text-muted-foreground hover:text-foreground'}`}>
                  <span className="mr-1.5">{opt.icon}</span>{opt.label}
                </button>
              ))}
            </div>
            {errors.questionTypes && <p className="text-xs text-destructive mt-1">{errors.questionTypes.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOfQuestions">Number of Questions *</Label>
              <Input id="numberOfQuestions" type="number" min={1} max={100} {...register('numberOfQuestions')} error={!!errors.numberOfQuestions} className="mt-1.5" />
              {errors.numberOfQuestions && <p className="text-xs text-destructive mt-1">{errors.numberOfQuestions.message}</p>}
            </div>
            <div>
              <Label htmlFor="marksPerQuestion">Marks Per Question *</Label>
              <Input id="marksPerQuestion" type="number" min={1} max={50} {...register('marksPerQuestion')} error={!!errors.marksPerQuestion} className="mt-1.5" />
              {errors.marksPerQuestion && <p className="text-xs text-destructive mt-1">{errors.marksPerQuestion.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-vedaai-400" />Difficulty Distribution</CardTitle>
          <CardDescription>Adjust the balance of question difficulty (must total 100%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={level}>{level}</Badge>
                </div>
                <span className="text-sm font-mono font-medium">{watchedDifficulty?.[level] ?? 0}%</span>
              </div>
              <Slider value={[watchedDifficulty?.[level] ?? 0]} min={0} max={100} step={5} onValueChange={([v]) => updateDifficulty(level, v)} />
            </div>
          ))}
          {errors.difficultyDistribution && <p className="text-xs text-destructive">{errors.difficultyDistribution.message || errors.difficultyDistribution.root?.message}</p>}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileUp className="w-5 h-5 text-vedaai-400" />Reference Material</CardTitle>
          <CardDescription>Optionally upload a PDF or text file for context</CardDescription>
        </CardHeader>
        <CardContent>
          {fileState ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-vedaai-500/30 bg-vedaai-500/5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-vedaai-400" />
                <span className="text-sm font-medium">{fileState.name}</span>
                <span className="text-xs text-muted-foreground">({(fileState.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button type="button" onClick={() => setDraft({ file: null })} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-vedaai-500 bg-vedaai-500/5' : 'border-border hover:border-vedaai-500/50'}`}>
              <input {...getInputProps()} />
              <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, TXT – Max 10MB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-vedaai-400" />Additional Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="instructions" placeholder="e.g. Focus on Newton's laws, include diagram-based questions..." rows={4} {...register('instructions')} className="mt-1.5" />
        </CardContent>
      </Card>

      <Separator />

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={resetDraft}>Reset Form</Button>
        <Button type="submit" variant="gradient" size="lg" loading={createMutation.isPending || generateMutation.isPending}>
          <Sparkles className="w-4 h-4 mr-2" />Generate Question Paper
        </Button>
      </div>
    </form>
  );
}
