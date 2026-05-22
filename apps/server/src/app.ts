import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { generalLimiter } from './middleware/rateLimiter';
import { ApiResponse } from './utils/ApiResponse';
import { assignmentRoutes } from './routes/assignment.routes';
import { resultRoutes } from './routes/result.routes';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(generalLimiter);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  app.use('/storage', express.static('storage'));

  app.get('/api/health', (_req, res) => {
    ApiResponse.success(res, { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), environment: env.NODE_ENV }, 'VedaAI Server is running');
  });

  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/results', resultRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
