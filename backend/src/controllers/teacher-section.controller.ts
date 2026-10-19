import { Request, Response } from "express";
import { z } from "zod";
import * as sectionService from "../services/teacher-section.service.js";

const createSectionSchema = z.object({
  offeringId: z.string().min(1),
  judul: z.string().min(1),
  urutan: z.number().optional(),
});

const updateSectionSchema = z.object({
  judul: z.string().min(1).optional(),
  urutan: z.number().optional(),
});

export async function createSectionController(req: Request, res: Response) {
  const userId = req.authUser!.id;
  const body = createSectionSchema.parse(req.body);
  const section = await sectionService.createSection(userId, body);
  res.status(201).json(section);
}

export async function updateSectionController(req: Request, res: Response) {
  const userId = req.authUser!.id;
  const sectionId = req.params.id as string;
  const body = updateSectionSchema.parse(req.body);
  const section = await sectionService.updateSection(userId, sectionId, body);
  res.json(section);
}

export async function deleteSectionController(req: Request, res: Response) {
  const userId = req.authUser!.id;
  const sectionId = req.params.id as string;
  await sectionService.deleteSection(userId, sectionId);
  res.status(204).end();
}
