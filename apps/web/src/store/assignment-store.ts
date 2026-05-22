import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssignmentInput, QuestionType, DifficultyDistribution } from '@vedaai/shared';

interface AssignmentDraft {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  difficultyDistribution: DifficultyDistribution;
  instructions: string;
  file: File | null;
}

const defaultDraft: AssignmentDraft = {
  title: '',
  subject: '',
  grade: '',
  dueDate: '',
  questionTypes: [],
  numberOfQuestions: 10,
  marksPerQuestion: 5,
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
  instructions: '',
  file: null,
};

interface AssignmentStore {
  // Draft state
  draft: AssignmentDraft;
  setDraft: (updates: Partial<AssignmentDraft>) => void;
  resetDraft: () => void;

  // Submission state
  isSubmitting: boolean;
  setSubmitting: (val: boolean) => void;

  // Current assignment tracking
  currentAssignmentId: string | null;
  setCurrentAssignmentId: (id: string | null) => void;
  currentJobId: string | null;
  setCurrentJobId: (id: string | null) => void;
}

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set) => ({
      draft: { ...defaultDraft },
      setDraft: (updates) =>
        set((state) => ({
          draft: { ...state.draft, ...updates },
        })),
      resetDraft: () => set({ draft: { ...defaultDraft } }),

      isSubmitting: false,
      setSubmitting: (val) => set({ isSubmitting: val }),

      currentAssignmentId: null,
      setCurrentAssignmentId: (id) => set({ currentAssignmentId: id }),
      currentJobId: null,
      setCurrentJobId: (id) => set({ currentJobId: id }),
    }),
    {
      name: 'vedaai-assignment-draft',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        draft: {
          ...state.draft,
          file: null, // Don't persist file in localStorage
        },
      }),
    },
  ),
);
