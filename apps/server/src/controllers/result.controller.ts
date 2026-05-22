import type { Request, Response } from 'express';
import { GeneratedPaperModel, AssignmentModel, QueueJobMetaModel } from '../models';
import { addAssessmentJob } from '../queues';
import { emitJobUpdate } from '../socket';
import { generatePDF } from '../services/pdf.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { JobStatus } from '@vedaai/shared';
import { logger } from '../config/logger';

export const getResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paper = await GeneratedPaperModel.findById(id);
  if (!paper) throw ApiError.notFound('Generated paper not found');
  const assignment = await AssignmentModel.findById(paper.assignmentId);
  if (!assignment) throw ApiError.notFound('Associated assignment not found');
  ApiResponse.success(res, { paper, assignment });
});

export const getResultByAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paper = await GeneratedPaperModel.findOne({ assignmentId: id }).sort({ createdAt: -1 });
  if (!paper) throw ApiError.notFound('No generated paper found for this assignment');
  const assignment = await AssignmentModel.findById(id);
  if (!assignment) throw ApiError.notFound('Assignment not found');
  ApiResponse.success(res, { paper, assignment });
});

export const regenerateResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paper = await GeneratedPaperModel.findById(id);
  if (!paper) throw ApiError.notFound('Generated paper not found');
  const assignment = await AssignmentModel.findById(paper.assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (assignment.status === JobStatus.PROCESSING) {
    throw ApiError.conflict('Regeneration is already in progress');
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

  await QueueJobMetaModel.create({ jobId, assignmentId: assignment._id, status: JobStatus.QUEUED });

  emitJobUpdate(assignment._id.toString(), {
    jobId, assignmentId: assignment._id.toString(), status: JobStatus.QUEUED, progress: 0, message: 'Regeneration queued',
  });

  logger.info(`Regeneration queued: job=${jobId} assignment=${assignment._id}`);
  ApiResponse.success(res, { jobId, status: JobStatus.QUEUED }, 'Regeneration queued');
});

export const downloadPDF = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paper = await GeneratedPaperModel.findById(id);
  if (!paper) throw ApiError.notFound('Generated paper not found');
  const assignment = await AssignmentModel.findById(paper.assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  logger.info(`Generating PDF for paper: ${id}`);
  const pdfBuffer = await generatePDF(paper, assignment);

  const fileName = `${paper.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});
