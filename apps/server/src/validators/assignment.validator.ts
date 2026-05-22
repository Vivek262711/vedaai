import { z } from 'zod';
import { QuestionType } from '@vedaai/shared';

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  dueDate: z.string().min(1, 'Due date is required').refine((val) => {
    const date = new Date(val);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date >= now;
  }, 'Due date cannot be in the past'),
  questionTypes: z.array(z.nativeEnum(QuestionType)).min(1, 'Select at least one question type'),
  numberOfQuestions: z.coerce.number().int().min(1, 'Minimum 1 question').max(100, 'Maximum 100 questions'),
  marksPerQuestion: z.coerce.number().int().min(1, 'Minimum 1 mark').max(50, 'Maximum 50 marks'),
  difficultyDistribution: z.object({
    easy: z.coerce.number().min(0).max(100),
    medium: z.coerce.number().min(0).max(100),
    hard: z.coerce.number().min(0).max(100),
  }).refine((v) => v.easy + v.medium + v.hard === 100, 'Distribution must sum to 100%'),
  instructions: z.string().max(2000).optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required').regex(/^[a-f\d]{24}$/i, 'Invalid ID format'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
