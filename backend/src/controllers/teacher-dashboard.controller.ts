import type { Request, Response } from "express";
import { getTeacherDashboard } from "../services/teacher-dashboard.service.js";

export async function getTeacherDashboardController(
  request: Request,
  response: Response
) {
  const data = await getTeacherDashboard(request.authUser!.id);
  response.json(data);
}
