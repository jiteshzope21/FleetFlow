import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/apiResponse.js';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        err.errors.forEach((issue) => {
          const path = issue.path.join('.') || 'root';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        });

        errorResponse(res, 'Validation failed. Please verify your input.', 400, formattedErrors);
        return;
      }
      next(err);
    }
  };
}

export function validate(schema: ZodSchema) {
  return validateRequest({ body: schema });
}
