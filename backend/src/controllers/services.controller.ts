import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";

export async function listServices(_req: Request, res: Response) {
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  res.json(services);
}

export async function createService(req: Request, res: Response) {
  const service = await prisma.service.create({ data: req.body });
  res.status(201).json(service);
}

export async function deactivateService(req: Request, res: Response) {
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: { active: false },
  }).catch(() => null);
  if (!service) throw new HttpError(404, "Service not found");
  res.status(204).send();
}
