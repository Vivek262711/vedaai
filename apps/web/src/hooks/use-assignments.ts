'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/services/assignment.service';
import { toast } from 'sonner';

export const ASSIGNMENT_KEYS = {
  all: ['assignments'] as const,
  lists: () => [...ASSIGNMENT_KEYS.all, 'list'] as const,
  list: (page: number, limit: number) => [...ASSIGNMENT_KEYS.lists(), { page, limit }] as const,
  details: () => [...ASSIGNMENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ASSIGNMENT_KEYS.details(), id] as const,
  results: () => ['results'] as const,
  result: (id: string) => [...ASSIGNMENT_KEYS.results(), id] as const,
};

export function useAssignments(page = 1, limit = 10) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.list(page, limit),
    queryFn: () => assignmentService.getAll(page, limit),
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.detail(id),
    queryFn: () => assignmentService.getById(id),
    enabled: !!id,
  });
}

export function useResult(id: string) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.result(id),
    queryFn: () => assignmentService.getResult(id),
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => assignmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.lists() });
      toast.success('Assignment created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create assignment');
    },
  });
}

export function useGenerateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentService.generate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.detail(id) });
      toast.info('Generation queued!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start generation');
    },
  });
}

export function useRegenerateResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentService.regenerate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.result(id) });
      toast.info('Regeneration queued!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate');
    },
  });
}
