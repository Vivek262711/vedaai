import type { Request, Response } from 'express';
import { AssignmentModel } from '../models';
import { addAssessmentJob } from '../queues';
import { QueueJobMetaModel } from '../models';
import { emitJobUpdate } from '../socket';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { JobStatus } from '@vedaai/shared';
import { logger } from '../config/logger';

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const file = req.file;

  const assignment = await AssignmentModel.create({
    ...data,
    ...(file && { fileUrl: `/storage/uploads/${file.filename}`, fileName: file.originalname }),
  });

  logger.info(`Assignment created: ${assignment._id}`);
  ApiResponse.created(res, { assignment }, 'Assignment created successfully');
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assignment = await AssignmentModel.findById(id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  let assignmentJson = assignment.toJSON() as any;
  if (assignment.status === JobStatus.FAILED) {
    const meta = await QueueJobMetaModel.findOne({ assignmentId: assignment._id }).sort({ createdAt: -1 });
    if (meta?.error) {
      assignmentJson = { ...assignmentJson, error: meta.error };
    }
  }

  ApiResponse.success(res, assignmentJson);
});

export const getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query as { page?: number; limit?: number };
  const skip = (Number(page) - 1) * Number(limit);

  const [assignments, total] = await Promise.all([
    AssignmentModel.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AssignmentModel.countDocuments(),
  ]);

  ApiResponse.paginated(res, assignments, total, Number(page), Number(limit));
});

export const generateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assignment = await AssignmentModel.findById(id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (assignment.status === JobStatus.PROCESSING) {
    throw ApiError.conflict('Generation is already in progress');
  }

  const jobId = await addAssessmentJob({
    assignmentId: assignment._id.toString(),
    title: assignment.title,
    subject: assignment.subject,
    grade: assignment.grade,
    questionTypes: assignment.questionTypes,
    numberOfQuestions: assignment.numberOfQuestions,
    marksPerQuestion: assignment.marksPerQuestion,
    difficultyDistribution: assignment.difficultyDistribution,
    instructions: assignment.instructions,
  });

  assignment.status = JobStatus.QUEUED;
  assignment.jobId = jobId;
  await assignment.save();

  await QueueJobMetaModel.create({
    jobId,
    assignmentId: assignment._id,
    status: JobStatus.QUEUED,
  });

  emitJobUpdate(assignment._id.toString(), {
    jobId,
    assignmentId: assignment._id.toString(),
    status: JobStatus.QUEUED,
    progress: 0,
    message: 'Job queued for processing',
  });

  logger.info(`Generation queued: job=${jobId} assignment=${id}`);
  ApiResponse.success(res, { jobId, status: JobStatus.QUEUED }, 'Generation queued');
});
