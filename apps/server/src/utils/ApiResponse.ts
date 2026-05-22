import type { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): Response {
    const payload: ApiResponsePayload<T[]> & { meta: Record<string, unknown> } = {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
    return res.status(200).json(payload);
  }

  static error(res: Response, statusCode: number, message: string, error?: string): Response {
    const payload: ApiResponsePayload = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(payload);
  }
}
