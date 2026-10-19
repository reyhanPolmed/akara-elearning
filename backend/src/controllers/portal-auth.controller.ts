import type { Request, Response } from "express";

import { portalAuth } from "../config/auth.js";
import { resolvePortalSessionUser } from "../services/portal-auth.service.js";
import { AppError } from "../utils/app-error.js";
import { buildHeaders } from "../utils/request-headers.js";

export async function getPortalSessionController(request: Request, response: Response) {
  const sessionResult = await portalAuth.api.getSession({
    headers: buildHeaders(request)
  });

  if (!sessionResult?.session || !sessionResult.user) {
    throw new AppError("Unauthorized", 401);
  }

  response.json(await resolvePortalSessionUser(sessionResult.user));
}
