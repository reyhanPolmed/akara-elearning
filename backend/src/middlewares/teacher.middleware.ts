import type { NextFunction, Request, Response } from "express";

import { portalAuth, teacherAuth } from "../config/auth.js";
import { AppError } from "../utils/app-error.js";
import { resolveRequestAuthSession } from "../services/request-auth.service.js";
import { requireTeacherContext } from "../services/teacher-context.service.js";

export async function teacherMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const sessionResult = await resolveRequestAuthSession(request, [portalAuth, teacherAuth]);

  if (!sessionResult?.session || !sessionResult.user) {
    next(new AppError("Unauthorized", 401));
    return;
  }

  try {
    await requireTeacherContext(sessionResult.user.id);
  } catch {
    next(new AppError("Akses hanya untuk dosen", 403));
    return;
  }

  request.authSession = sessionResult.session;
  request.authUser = sessionResult.user;
  next();
}
