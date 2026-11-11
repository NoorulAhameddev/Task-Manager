import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

function formatIssues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: { message: 'Validation failed', errors: formatIssues(result.error) },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: { message: 'Validation failed', errors: formatIssues(result.error) },
      });
      return;
    }
    req.validatedQuery = result.data as Record<string, unknown>;
    next();
  };
}
