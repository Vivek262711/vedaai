import { Worker, type Job } from 'bullmq';
import { getQueueConnection } from '../queues/connection';
import { ASSESSMENT_QUEUE_NAME, type AssessmentJobData } from '../queues/assessment.queue';
import { generateAssessment } from '../services/ai.service';
import { AssignmentModel, GeneratedPaperModel, QueueJobMetaModel } from '../models';
import { emitJobUpdate } from '../socket';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { JobStatus } from '@vedaai/shared';

async function processAssessmentJob(job: Job<AssessmentJobData>): Promise<void> {
  const { assignmentId } = job.data;

  logger.info('╔══════════════════════════════════════════════╗');
  logger.info('║  [Worker] JOB PICKED UP                      ║');
  logger.info('╚══════════════════════════════════════════════╝');
  logger.info(`[Worker] Job ID: ${job.id}`);
  logger.info(`[Worker] Assignment: ${assignmentId}`);
  logger.info(`[Worker] Title: ${job.data.title}`);
  logger.info(`[Worker] Questions requested: ${job.data.numberOfQuestions}`);
  logger.info(`[Worker] Attempt: ${job.attemptsMade + 1} / ${job.opts?.attempts ?? 3}`);

  try {
    // ── Step 1: Update status to PROCESSING ──
    logger.info('[Worker] Step 1/4 — Updating status to PROCESSING...');
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: JobStatus.PROCESSING });
    await QueueJobMetaModel.findOneAndUpdate({ jobId: job.id }, { status: JobStatus.PROCESSING, startedAt: new Date(), attempts: job.attemptsMade + 1 });

    emitJobUpdate(assignmentId, { jobId: job.id!, assignmentId, status: JobStatus.PROCESSING, progress: 10, message: 'Starting AI generation...' });
    await job.updateProgress(10);
    logger.info('[Worker] ✅ Status updated. WebSocket emitted (10%)');

    // ── Step 2: AI Generation ──
    logger.info('[Worker] Step 2/4 — Calling AI generation pipeline...');
    emitJobUpdate(assignmentId, { jobId: job.id!, assignmentId, status: JobStatus.PROCESSING, progress: 30, message: 'AI is generating questions...' });
    await job.updateProgress(30);

    const paper = await generateAssessment(job.data);

    logger.info(`[Worker] ✅ AI generation complete. Sections: ${paper.sections.length}`);
    emitJobUpdate(assignmentId, { jobId: job.id!, assignmentId, status: JobStatus.PROCESSING, progress: 70, message: 'Saving generated paper...' });
    await job.updateProgress(70);

    // ── Step 3: Save to MongoDB ──
    logger.info('[Worker] Step 3/4 — Saving paper to MongoDB...');
    const totalMarks = paper.sections.reduce((sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.marks, 0), 0);

    const savedPaper = await GeneratedPaperModel.create({
      assignmentId,
      title: paper.title,
      instructions: paper.instructions,
      totalMarks,
      duration: paper.duration,
      sections: paper.sections,
    });

    logger.info(`[Worker] ✅ Paper saved to MongoDB. Paper ID: ${savedPaper._id} | Total Marks: ${totalMarks}`);

    // ── Step 4: Update assignment & emit completion ──
    logger.info('[Worker] Step 4/4 — Finalizing assignment status...');
    await AssignmentModel.findByIdAndUpdate(assignmentId, {
      status: JobStatus.COMPLETED,
      generatedPaperId: savedPaper._id,
    });

    await QueueJobMetaModel.findOneAndUpdate({ jobId: job.id }, {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      progress: 100,
      paperId: savedPaper._id,
    });

    emitJobUpdate(assignmentId, { jobId: job.id!, assignmentId, status: JobStatus.COMPLETED, progress: 100, message: 'Question paper generated!', paperId: savedPaper._id.toString() });
    await job.updateProgress(100);

    logger.info('╔══════════════════════════════════════════════╗');
    logger.info('║  [Worker] ✅ JOB COMPLETED SUCCESSFULLY      ║');
    logger.info('╚══════════════════════════════════════════════╝');
    logger.info(`[Worker] Job: ${job.id} | Paper: ${savedPaper._id}`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';

    logger.error('╔══════════════════════════════════════════════╗');
    logger.error('║  [Worker] ❌ JOB FAILED                      ║');
    logger.error('╚══════════════════════════════════════════════╝');
    logger.error(`[Worker] Job: ${job.id} | Error: ${errMsg}`);

    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: JobStatus.FAILED });
    await QueueJobMetaModel.findOneAndUpdate({ jobId: job.id }, { status: JobStatus.FAILED, error: errMsg });

    emitJobUpdate(assignmentId, { jobId: job.id!, assignmentId, status: JobStatus.FAILED, progress: 0, message: 'Generation failed', error: errMsg });

    throw error; // Re-throw for BullMQ retry logic
  }
}

let worker: Worker<AssessmentJobData> | null = null;

export function startAssessmentWorker(): Worker<AssessmentJobData> {
  if (worker) return worker;

  worker = new Worker<AssessmentJobData>(
    ASSESSMENT_QUEUE_NAME,
    processAssessmentJob,
    {
      connection: getQueueConnection(),
      concurrency: env.QUEUE_CONCURRENCY,
      limiter: { max: 5, duration: 60000 },
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[Worker] 🏁 Job completed event: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Worker] 💥 Job failed event: ${job?.id} — ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error('[Worker] ⚠️ Worker error event:', err);
  });

  worker.on('active', (job) => {
    logger.info(`[Worker] 🔄 Job active: ${job.id}`);
  });

  worker.on('stalled', (jobId) => {
    logger.warn(`[Worker] ⏸️ Job stalled: ${jobId}`);
  });

  logger.info(`✅ Assessment worker started (concurrency: ${env.QUEUE_CONCURRENCY})`);
  return worker;
}

export async function stopAssessmentWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Assessment worker stopped');
  }
}
