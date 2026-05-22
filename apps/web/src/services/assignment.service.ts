import { apiGet, apiPost, apiPostForm } from './api';
import type {
  Assignment,
  CreateAssignmentResponse,
  GenerateResponse,
  AssignmentListResponse,
  PaperResultResponse,
} from '@vedaai/shared';

export const assignmentService = {
  async create(data: FormData): Promise<CreateAssignmentResponse> {
    const response = await apiPostForm<CreateAssignmentResponse>('/assignments', data);
    return response.data!;
  },

  async getById(id: string): Promise<Assignment> {
    const response = await apiGet<Assignment>(`/assignments/${id}`);
    return response.data!;
  },

  async getAll(page = 1, limit = 10): Promise<AssignmentListResponse> {
    const response = await apiGet<any>(`/assignments?page=${page}&limit=${limit}`);
    return {
      assignments: response.data || [],
      total: response.meta?.total || 0,
      page: response.meta?.page || page,
      limit: response.meta?.limit || limit,
    };
  },

  async generate(id: string): Promise<GenerateResponse> {
    const response = await apiPost<GenerateResponse>(`/assignments/${id}/generate`);
    return response.data!;
  },

  async getResult(id: string): Promise<PaperResultResponse> {
    const response = await apiGet<PaperResultResponse>(`/results/${id}`);
    return response.data!;
  },

  async regenerate(id: string): Promise<GenerateResponse> {
    const response = await apiPost<GenerateResponse>(`/results/${id}/regenerate`);
    return response.data!;
  },
};
