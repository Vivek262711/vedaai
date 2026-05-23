import { io, type Socket } from 'socket.io-client';
import { SocketEvents, type JobUpdate } from '@vedaai/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true',
        'serveo-skip-browser-warning': 'true',
      },
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinAssignmentRoom(assignmentId: string): void {
  const s = getSocket();
  s.emit(SocketEvents.JOIN_ROOM, assignmentId);
}

export function leaveAssignmentRoom(assignmentId: string): void {
  const s = getSocket();
  s.emit(SocketEvents.LEAVE_ROOM, assignmentId);
}

export function onJobUpdate(callback: (update: JobUpdate) => void): () => void {
  const s = getSocket();

  const events = [
    SocketEvents.JOB_QUEUED,
    SocketEvents.JOB_PROCESSING,
    SocketEvents.JOB_PROGRESS,
    SocketEvents.JOB_COMPLETED,
    SocketEvents.JOB_FAILED,
  ];

  events.forEach((event) => {
    s.on(event, callback);
  });

  // Return cleanup function
  return () => {
    events.forEach((event) => {
      s.off(event, callback);
    });
  };
}

export { SocketEvents };
