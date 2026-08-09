import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller";
import { optionalCustomer } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { initiatePaymentSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const paymentsRouter = Router();

paymentsRouter.post("/initiate", optionalCustomer, validateBody(initiatePaymentSchema), asyncHandler(paymentsController.initiate));
paymentsRouter.post("/:id/confirm-sandbox", asyncHandler(paymentsController.confirm));
