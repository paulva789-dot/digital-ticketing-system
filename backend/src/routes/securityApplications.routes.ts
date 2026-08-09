import { Router } from "express";
import * as securityApplicationsController from "../controllers/securityApplications.controller";
import { requireStaff } from "../middleware/staffAuth";
import { validateBody } from "../middleware/validate";
import { securityApplicationSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const securityApplicationsRouter = Router();

securityApplicationsRouter.post(
  "/",
  validateBody(securityApplicationSchema),
  asyncHandler(securityApplicationsController.apply)
);
securityApplicationsRouter.get("/", requireStaff, asyncHandler(securityApplicationsController.listRecent));
