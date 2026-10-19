import type { Request, Response } from "express";

import { getStudentTaskDetail, submitTaskSubmission } from "../services/task.service.js";
import { idParamSchema } from "../validators/common.validator.js";
import { taskSubmitSchema } from "../validators/task.validator.js";

export async function getTaskController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const task = await getStudentTaskDetail(params.id, request.authUser!.id);
  response.json(task);
}

export async function submitTaskController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const payload = taskSubmitSchema.parse(request.body);
  const task = await submitTaskSubmission(params.id, request.authUser!.id, payload);
  response.json(task);
}
