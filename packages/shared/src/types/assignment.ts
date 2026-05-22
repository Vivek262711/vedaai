// ── Enums ──

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionType {
  MCQ = 'mcq',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  TRUE_FALSE = 'true_false',
  FILL_IN_BLANK = 'fill_in_blank',
}

export enum JobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ── Assignment ──

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface AssignmentInput {
  title: string;
  subject?: string;
  grade?: string;
  dueDate: string;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Assignment extends AssignmentInput {
  _id: string;
  status: JobStatus;
  generatedPaperId?: string;
  jobId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Generated Paper ──

export interface Question {
  id: string;
  question: string;
  marks: number;
  difficulty: Difficulty;
  type: QuestionType;
  options?: string[];        // For MCQ
  answer?: string;           // Optional answer key
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  title: string;
  instructions: string;
  totalMarks: number;
  duration?: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

// ── Student Info (for output page) ──

export interface StudentInfo {
  name: string;
  rollNumber: string;
  section: string;
}
