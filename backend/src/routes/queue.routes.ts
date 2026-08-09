import { Router } from "express";
import * as queueController from "../controllers/queue.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const queueRouter = Router();

queueRouter.get("/:serviceId", asyncHandler(queueController.queueStatus));
