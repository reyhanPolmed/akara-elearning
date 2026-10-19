import type { Request, Response } from "express";

import {
  completeLesson,
  getStudentLessonDetail,
  trackLessonDuration
} from "../services/lesson.service.js";
import { idParamSchema } from "../validators/common.validator.js";
import { lessonDurationSchema } from "../validators/lesson.validator.js";

export async function getLessonController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const lesson = await getStudentLessonDetail(params.id, request.authUser!.id);
  response.json(lesson);
}

export async function trackLessonDurationController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const payload = lessonDurationSchema.parse(request.body);
  const lesson = await trackLessonDuration(params.id, request.authUser!.id, payload.seconds);
  response.json(lesson);
}

export async function completeLessonController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const lesson = await completeLesson(params.id, request.authUser!.id);
  response.json(lesson);
}
