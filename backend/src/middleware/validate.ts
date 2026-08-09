import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

export function validateBody(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.flatten() });
      }
      next(err);
    }
  };
}
