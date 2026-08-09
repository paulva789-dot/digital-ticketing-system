import { Router } from "express";
import * as servicesController from "../controllers/services.controller";
import { requireAdmin, requireStaff } from "../middleware/staffAuth";
import { validateBody } from "../middleware/validate";
import { createServiceSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const servicesRouter = Router();

servicesRouter.get("/", asyncHandler(servicesController.listServices));
servicesRouter.post(
  "/",
  requireStaff,
  requireAdmin,
  validateBody(createServiceSchema),
  asyncHandler(servicesController.createService)
);
servicesRouter.delete("/:id", requireStaff, requireAdmin, asyncHandler(servicesController.deactivateService));
