import dns from 'node:dns';
import http from 'http';

// Override default DNS servers to resolve MongoDB Atlas SRV records successfully
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
import { initializeSocket } from './socket';
import { getAssessmentQueue, closeAssessmentQueue } from './queues';
import { closeQueueConnection } from './queues/connection';
import { startAssessmentWorker, stopAssessmentWorker } from './workers/assessment.worker';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  logger.info('🚀 Starting VedaAI Server...');
  logger.info(`📌 Environment: ${env.NODE_ENV}`);

  await connectDatabase();
  await getRedisClient();

  const app = createApp();
  const httpServer = http.createServer(app);

  initializeSocket(httpServer);
  getAssessmentQueue();
  startAssessmentWorker();

  httpServer.listen(env.PORT, () => {
    logger.info(`✅ VedaAI Server running on http://localhost:${env.PORT}`);
    logger.info(`📡 Socket.IO ready`);
    logger.info(`📋 Health: http://localhost:${env.PORT}/api/health`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);
    httpServer.close(async () => {
      try {
        await stopAssessmentWorker();
        await closeAssessmentQueue();
        await closeQueueConnection();
        await disconnectRedis();
        await disconnectDatabase();
        logger.info('✅ Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));
  process.on('uncaughtException', (error) => { logger.error('Uncaught Exception:', error); process.exit(1); });
}

bootstrap().catch((err) => { logger.error('Fatal error:', err); process.exit(1); });
