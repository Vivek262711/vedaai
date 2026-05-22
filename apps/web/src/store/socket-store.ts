import { create } from 'zustand';
import type { JobStatus, JobUpdate } from '@vedaai/shared';

interface JobState {
  status: JobStatus;
  progress: number;
  message?: string;
  paperId?: string;
  error?: string;
}

interface SocketStore {
  isConnected: boolean;
  setConnected: (val: boolean) => void;

  // Track job states by assignmentId
  jobStates: Record<string, JobState>;
  updateJobState: (assignmentId: string, update: JobUpdate) => void;
  clearJobState: (assignmentId: string) => void;
  getJobState: (assignmentId: string) => JobState | undefined;
}

export const useSocketStore = create<SocketStore>()((set, get) => ({
  isConnected: false,
  setConnected: (val) => set({ isConnected: val }),

  jobStates: {},
  updateJobState: (assignmentId, update) =>
    set((state) => ({
      jobStates: {
        ...state.jobStates,
        [assignmentId]: {
          status: update.status,
          progress: update.progress ?? state.jobStates[assignmentId]?.progress ?? 0,
          message: update.message,
          paperId: update.paperId,
          error: update.error,
        },
      },
    })),
  clearJobState: (assignmentId) =>
    set((state) => {
      const newStates = { ...state.jobStates };
      delete newStates[assignmentId];
      return { jobStates: newStates };
    }),
  getJobState: (assignmentId) => get().jobStates[assignmentId],
}));
