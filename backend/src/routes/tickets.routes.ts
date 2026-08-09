import { Router } from "express";
import * as ticketsController from "../controllers/tickets.controller";
import { optionalCustomer } from "../middleware/auth";
import { requireStaff } from "../middleware/staffAuth";
import { validateBody } from "../middleware/validate";
import { createTicketSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const ticketsRouter = Router();

ticketsRouter.post(
  "/",
  optionalCustomer,
  validateBody(createTicketSchema),
  asyncHandler(ticketsController.createTicket)
);
ticketsRouter.get("/:id", asyncHandler(ticketsController.getTicket));
ticketsRouter.post("/:id/status", requireStaff, asyncHandler(ticketsController.updateStatus));
ticketsRouter.post("/services/:serviceId/call-next", requireStaff, asyncHandler(ticketsController.callNext));
