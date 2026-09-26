import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../errors/AppError.js";

interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schema: RequestValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(new ValidationError("Request validation failed", formattedErrors));
      } else {
        next(error);
      }
    }
  };
}
