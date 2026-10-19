import type { Request, Response } from "express";

import {
  getQuizResult,
  getStudentQuizDetail,
  saveQuizAttemptAnswers,
  startQuizAttempt,
  submitQuizAttempt
} from "../services/quiz.service.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  quizAttemptSaveSchema,
  quizSubmitSchema
} from "../validators/quiz.validator.js";

export async function getQuizController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const quiz = await getStudentQuizDetail(params.id, request.authUser!.id);
  response.json(quiz);
}

export async function startQuizController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const attempt = await startQuizAttempt(params.id, request.authUser!.id);
  response.json(attempt);
}

export async function saveQuizAttemptController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const payload = quizAttemptSaveSchema.parse(request.body);
  const attempt = await saveQuizAttemptAnswers(params.id, request.authUser!.id, payload);
  response.json(attempt);
}

export async function submitQuizController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const payload = quizSubmitSchema.parse(request.body);
  const result = await submitQuizAttempt(params.id, request.authUser!.id, payload);
  response.json(result);
}

export async function getQuizResultController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const result = await getQuizResult(params.id, request.authUser!.id);
  response.json(result);
}
