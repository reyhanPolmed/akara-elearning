import type { Request, Response } from "express";

import { getStudentDashboard } from "../services/dashboard.service.js";

export async function getDashboardController(request: Request, response: Response) {
  const dashboard = await getStudentDashboard(request.authUser!.id);
  response.json(dashboard);
}
