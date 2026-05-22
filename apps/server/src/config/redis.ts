import IORedis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redisClient: IORedis | null = null;

export function createRedisConnection(name: string = 'default'): IORedis {
  const isTLS = env.REDIS_URL.startsWith('rediss://');
  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
    ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
  });

  connection.on('connect', () => {
    logger.info(`✅ Redis [${name}] connected`);
  });

  connection.on('error', (err) => {
    logger.error(`Redis [${name}] error:`, err.message);
  });

  connection.on('close', () => {
    logger.warn(`Redis [${name}] connection closed`);
  });

  return connection;
}

export async function getRedisClient(): Promise<IORedis> {
  if (!redisClient) {
    redisClient = createRedisConnection('main');
    await redisClient.connect();
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
}

export { IORedis };
