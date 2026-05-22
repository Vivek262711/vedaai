import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

let queueConnection: IORedis | null = null;

export function getQueueConnection(): IORedis {
  if (!queueConnection) {
    const isTLS = env.REDIS_URL.startsWith('rediss://');
    queueConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
    });

    queueConnection.on('connect', () => {
      logger.info('✅ BullMQ Redis connection established');
    });

    queueConnection.on('error', (err) => {
      logger.error('BullMQ Redis error:', err.message);
    });
  }

  return queueConnection;
}

export async function closeQueueConnection(): Promise<void> {
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = null;
    logger.info('BullMQ Redis connection closed');
  }
}
