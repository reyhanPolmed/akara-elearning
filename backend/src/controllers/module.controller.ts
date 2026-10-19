import type { Request, Response } from "express";

import { getStudentModuleDetail, listStudentCourses, listStudentModules } from "../services/module.service.js";
import { idParamSchema } from "../validators/common.validator.js";

export async function listModulesController(request: Request, response: Response) {
  const modules = await listStudentModules(request.authUser!.id);
  response.json(modules);
}

export async function getModuleController(request: Request, response: Response) {
  const params = idParamSchema.parse(request.params);
  const module = await getStudentModuleDetail(params.id, request.authUser!.id);
  response.json(module);
}

export async function listCoursesController(request: Request, response: Response) {
  const courses = await listStudentCourses(request.authUser!.id);
  response.json(courses);
}
