'use client';

import { useEffect, useRef } from 'react';
import {
  connectSocket,
  disconnectSocket,
  joinAssignmentRoom,
  leaveAssignmentRoom,
  onJobUpdate,
  getSocket,
} from '@/services/socket';
import { useSocketStore } from '@/store/socket-store';
import { useQueryClient } from '@tanstack/react-query';
import { ASSIGNMENT_KEYS } from './use-assignments';
import type { JobUpdate } from '@vedaai/shared';
import { toast } from 'sonner';

export function useSocket() {
  const { setConnected } = useSocketStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const socket = connectSocket();

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    return () => {
      disconnectSocket();
      setConnected(false);
      initializedRef.current = false;
    };
  }, [setConnected]);
}

export function useAssignmentSocket(assignmentId: string | null) {
  const { updateJobState } = useSocketStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!assignmentId) return;

    const socket = getSocket();
    if (!socket.connected) {
      connectSocket();
    }

    joinAssignmentRoom(assignmentId);

    const cleanup = onJobUpdate((update: JobUpdate) => {
      updateJobState(assignmentId, update);

      // Show toast notifications
      switch (update.status) {
        case 'processing':
          toast.info('Generating your question paper...', { id: `job-${assignmentId}` });
          break;
        case 'completed':
          toast.success('Question paper generated successfully!', { id: `job-${assignmentId}` });
          queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
          break;
        case 'failed':
          toast.error(update.error || 'Generation failed. Please try again.', { id: `job-${assignmentId}` });
          queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
          break;
      }
    });

    return () => {
      leaveAssignmentRoom(assignmentId);
      cleanup();
    };
  }, [assignmentId, updateJobState]);
}
