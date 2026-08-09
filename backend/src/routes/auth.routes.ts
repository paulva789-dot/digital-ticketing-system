import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { staffLoginSchema, staffRegisterSchema } from "../schemas/auth.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", validateBody(staffRegisterSchema), asyncHandler(authController.registerStaff));
authRouter.post("/login", validateBody(staffLoginSchema), asyncHandler(authController.loginStaff));
