import type { Request, Response } from "express";

import { auth, portalAuth } from "../config/auth.js";
import { getStudentProfile, updateStudentProfile } from "../services/profile.service.js";
import { buildHeaders } from "../utils/request-headers.js";
import {
  changePasswordSchema,
  profileUpdateSchema
} from "../validators/auth.validator.js";

export async function getProfileController(request: Request, response: Response) {
  const profile = await getStudentProfile(request.authUser!.id);
  response.json(profile);
}

export async function updateProfileController(request: Request, response: Response) {
  const payload = profileUpdateSchema.parse(request.body);
  const profile = await updateStudentProfile(request.authUser!.id, payload);
  response.json(profile);
}

export async function changePasswordController(request: Request, response: Response) {
  const payload = changePasswordSchema.parse(request.body);
  const headers = buildHeaders(request);
  const body = {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    revokeOtherSessions: false
  };

  try {
    await portalAuth.api.changePassword({
      headers,
      body
    });
  } catch {
    await auth.api.changePassword({
      headers,
      body
    });
  }

  response.json({
    success: true
  });
}
