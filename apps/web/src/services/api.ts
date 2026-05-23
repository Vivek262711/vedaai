import axios from 'axios';
import type { ApiResponse } from '@vedaai/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'serveo-skip-browser-warning': 'true',
  },
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      console.error(`API Error [${error.response.status}]:`, message);
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  },
);

// Typed API helpers
export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url);
  return response.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

export async function apiPostForm<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Bypass-Tunnel-Reminder': 'true',
      'serveo-skip-browser-warning': 'true',
    },
  });
  return response.data;
}
