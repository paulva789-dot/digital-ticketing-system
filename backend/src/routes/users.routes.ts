import { Router } from "express";
import * as usersController from "../controllers/users.controller";
import { requireCustomer } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { updateLocaleSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const usersRouter = Router();

usersRouter.get("/me", requireCustomer, asyncHandler(usersController.getMe));
usersRouter.get("/me/tickets", requireCustomer, asyncHandler(usersController.getMyTickets));
usersRouter.post("/me/premium", requireCustomer, asyncHandler(usersController.setPremium));
usersRouter.post("/me/locale", requireCustomer, validateBody(updateLocaleSchema), asyncHandler(usersController.setLocale));
