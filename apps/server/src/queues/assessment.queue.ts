import { Queue } from 'bullmq';
import { getQueueConnection } from './connection';
import { logger } from '../config/logger';

export const ASSESSMENT_QUEUE_NAME = 'assessment-generation';

export interface AssessmentJobData {
  assignmentId: string;
  title: string;
  subject?: string;
  grade?: string;
  questionTypes: string[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  instructions?: string;
  fileContent?: string;
}

let assessmentQueue: Queue<AssessmentJobData> | null = null;

export function getAssessmentQueue(): Queue<AssessmentJobData> {
  if (!assessmentQueue) {
    assessmentQueue = new Queue<AssessmentJobData>(ASSESSMENT_QUEUE_NAME, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24h
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7d
        },
      },
    });

    logger.info(`✅ Assessment queue [${ASSESSMENT_QUEUE_NAME}] initialized`);
  }

  return assessmentQueue;
}

export async function addAssessmentJob(data: AssessmentJobData): Promise<string> {
  const queue = getAssessmentQueue();
  const job = await queue.add('generate', data, {
    jobId: `assessment-${data.assignmentId}-${Date.now()}`,
  });

  logger.info(`📥 Job added to queue: ${job.id} for assignment ${data.assignmentId}`);
  return job.id!;
}

export async function closeAssessmentQueue(): Promise<void> {
  if (assessmentQueue) {
    await assessmentQueue.close();
    assessmentQueue = null;
    logger.info('Assessment queue closed');
  }
}
