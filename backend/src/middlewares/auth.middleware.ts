import type { NextFunction, Request, Response } from "express";

import { portalAuth, studentAuth, teacherAuth } from "../config/auth.js";
import { resolveRequestAuthSession } from "../services/request-auth.service.js";
import { AppError } from "../utils/app-error.js";

export async function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  const isTeacherRoute = request.originalUrl.includes("/api/teacher");
  const legacyAuth = isTeacherRoute ? teacherAuth : studentAuth;
  const sessionResult = await resolveRequestAuthSession(request, [portalAuth, legacyAuth]);

  if (!sessionResult?.session || !sessionResult.user) {
    next(new AppError("Unauthorized", 401));
    return;
  }

  request.authSession = sessionResult.session;
  request.authUser = sessionResult.user;
  next();
}
