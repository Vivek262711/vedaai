import type { Assignment, GeneratedPaper, JobStatus } from './assignment';

// ── Generic API Response ──

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: any;
}

// ── API Payloads ──

export interface CreateAssignmentResponse {
  assignment: Assignment;
  jobId: string;
}

export interface GenerateResponse {
  jobId: string;
  status: JobStatus;
}

export interface AssignmentListResponse {
  assignments: Assignment[];
  total: number;
  page: number;
  limit: number;
}

export interface PaperResultResponse {
  paper: GeneratedPaper;
  assignment: Assignment;
}

// ── Socket Events ──

export enum SocketEvents {
  JOB_QUEUED = 'job:queued',
  JOB_PROCESSING = 'job:processing',
  JOB_PROGRESS = 'job:progress',
  JOB_COMPLETED = 'job:completed',
  JOB_FAILED = 'job:failed',
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',
}

export interface JobUpdate {
  jobId: string;
  assignmentId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  paperId?: string;
  error?: string;
}
