import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'params' | 'query';

/** Validates and replaces req[source] with the parsed (coerced) value. */
export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true });
    } else {
      req[source] = result.data;
    }
    next();
  };
