import { Request, Response } from "express";
import { getQueueStatus } from "../services/queue.service";

export async function queueStatus(req: Request, res: Response) {
  const status = await getQueueStatus(req.params.serviceId);
  res.json(status);
}
