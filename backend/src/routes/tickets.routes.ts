import { Router } from "express";
import * as ticketsController from "../controllers/tickets.controller";
import { optionalCustomer } from "../middleware/auth";
import { requireStaff } from "../middleware/staffAuth";
import { validateBody } from "../middleware/validate";
import { createTicketSchema, payInstallmentSchema, rescheduleTicketSchema } from "../schemas/ticket.schema";
import { asyncHandler } from "../utils/asyncHandler";

export const ticketsRouter = Router();

ticketsRouter.post(
  "/",
  optionalCustomer,
  validateBody(createTicketSchema),
  asyncHandler(ticketsController.createTicket)
);
ticketsRouter.get("/:id", asyncHandler(ticketsController.getTicket));
ticketsRouter.get("/:id/document", asyncHandler(ticketsController.getDocument));
ticketsRouter.post(
  "/:id/reschedule",
  validateBody(rescheduleTicketSchema),
  asyncHandler(ticketsController.reschedule)
);
ticketsRouter.post("/:id/cancel", asyncHandler(ticketsController.cancel));
ticketsRouter.post(
  "/:id/pay-installment",
  validateBody(payInstallmentSchema),
  asyncHandler(ticketsController.payInstallment)
);
ticketsRouter.post("/:id/status", requireStaff, asyncHandler(ticketsController.updateStatus));
ticketsRouter.post("/services/:serviceId/call-next", requireStaff, asyncHandler(ticketsController.callNext));
