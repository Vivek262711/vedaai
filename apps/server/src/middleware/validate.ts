import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const formattedErrors = zodError.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      next(ApiError.badRequest('Validation failed', formattedErrors));
      return;
    }

    // Replace request data with parsed (and potentially transformed) data
    req[target] = result.data;
    next();
  };
}
