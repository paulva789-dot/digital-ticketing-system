import { Router } from "express";
import * as servicesController from "../controllers/services.controller";
import { requireAdmin, requireStaff } from "../middleware/staffAuth";
import { validateBody } from "../middleware/validate";
import { createServiceSchema, updateServiceSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const servicesRouter = Router();

servicesRouter.get("/", asyncHandler(servicesController.listServices));
servicesRouter.get("/admin/all", requireStaff, requireAdmin, asyncHandler(servicesController.listAllServices));
servicesRouter.post(
  "/",
  requireStaff,
  requireAdmin,
  validateBody(createServiceSchema),
  asyncHandler(servicesController.createService)
);
servicesRouter.patch(
  "/:id",
  requireStaff,
  requireAdmin,
  validateBody(updateServiceSchema),
  asyncHandler(servicesController.updateService)
);
servicesRouter.delete("/:id", requireStaff, requireAdmin, asyncHandler(servicesController.deactivateService));
