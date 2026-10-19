import type { Request, Response } from "express";
import { z } from "zod";
import {
  createLesson,
  deleteLesson,
  getLessonById,
  publishLesson,
  updateLesson,
} from "../services/teacher-lesson.service.js";
import { idParamSchema } from "../validators/common.validator.js";

const createLessonSchema = z.object({
  moduleStudentClassId: z.string(),
  sectionId: z.string().optional(),
  judul: z.string().min(1),
  tipeKonten: z.enum(["text", "video", "pdf", "link"]),
  konten: z.string().default(""),
  urlKonten: z.string().optional(),
  contentFile: z
    .object({
      fileName: z.string().min(1),
      mimeType: z.string().min(1),
      base64Data: z.string().min(1)
    })
    .optional(),
  durasi: z.number().int().positive().optional(),
  tersediaPada: z.string().optional(),
  posisi: z.number().int().positive().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const updateLessonSchema = createLessonSchema
  .omit({ moduleStudentClassId: true })
  .partial();

const statusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

export async function createLessonController(
  request: Request,
  response: Response
) {
  const payload = createLessonSchema.parse(request.body);
  const lesson = await createLesson(request.authUser!.id, payload);
  response.status(201).json(lesson);
}

export async function getLessonTeacherController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const lesson = await getLessonById(id, request.authUser!.id);
  response.json(lesson);
}

export async function updateLessonController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const payload = updateLessonSchema.parse(request.body);
  const lesson = await updateLesson(id, request.authUser!.id, payload);
  response.json(lesson);
}

export async function patchLessonStatusController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const { status } = statusSchema.parse(request.body);
  const lesson = await publishLesson(id, request.authUser!.id, status);
  response.json(lesson);
}

export async function deleteLessonController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const result = await deleteLesson(id, request.authUser!.id);
  response.json(result);
}
