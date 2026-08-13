import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { requireAdmin, requireStaff } from "../middleware/staffAuth";
import { asyncHandler } from "../utils/asyncHandler";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/tickets-per-service",
  requireStaff,
  requireAdmin,
  asyncHandler(analyticsController.ticketsPerService)
);
analyticsRouter.get("/overview", requireStaff, requireAdmin, asyncHandler(analyticsController.overview));
