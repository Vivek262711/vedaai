import { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { SocketEvents, type JobUpdate } from '@vedaai/shared';
import { logger } from '../config/logger';
import { env } from '../config/env';

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    // Join assignment-specific room
    socket.on(SocketEvents.JOIN_ROOM, (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
      logger.debug(`Socket ${socket.id} joined room: assignment:${assignmentId}`);
    });

    // Leave assignment room
    socket.on(SocketEvents.LEAVE_ROOM, (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
      logger.debug(`Socket ${socket.id} left room: assignment:${assignmentId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error [${socket.id}]:`, error);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return io;
}

export function emitJobUpdate(assignmentId: string, update: JobUpdate): void {
  const socketIO = getIO();
  const eventMap: Record<string, string> = {
    queued: SocketEvents.JOB_QUEUED,
    processing: SocketEvents.JOB_PROCESSING,
    completed: SocketEvents.JOB_COMPLETED,
    failed: SocketEvents.JOB_FAILED,
  };

  const event = eventMap[update.status] || SocketEvents.JOB_PROGRESS;

  // Emit to specific assignment room
  socketIO.to(`assignment:${assignmentId}`).emit(event, update);

  // Also emit progress updates
  if (update.progress !== undefined) {
    socketIO.to(`assignment:${assignmentId}`).emit(SocketEvents.JOB_PROGRESS, update);
  }

  logger.debug(`📡 Emitted ${event} to assignment:${assignmentId}`, {
    status: update.status,
    progress: update.progress,
  });
}
