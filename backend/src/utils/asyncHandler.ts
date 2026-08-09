import { NextFunction, Request, RequestHandler, Response } from "express";

/** Wraps an async Express handler so rejected promises reach errorHandler instead of hanging. */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
