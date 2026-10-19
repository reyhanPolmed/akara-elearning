import type { Request, Response } from "express";

import { auth } from "../config/auth.js";
import { getStudentProfile } from "../services/profile.service.js";
import { sendWebResponse } from "../utils/http-response.js";
import { buildHeaders } from "../utils/request-headers.js";
import { loginSchema } from "../validators/auth.validator.js";

export async function loginController(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);

  const authResponse = await auth.api.signInEmail({
    body: {
      email: payload.email,
      password: payload.password
    },
    headers: buildHeaders(request),
    asResponse: true
  });

  await sendWebResponse(authResponse, response);
}


export async function logoutController(request: Request, response: Response) {
  const authResponse = await auth.api.signOut({
    headers: buildHeaders(request),
    asResponse: true
  });

  await sendWebResponse(authResponse, response);
}

export async function getCurrentUserController(request: Request, response: Response) {
  const profile = await getStudentProfile(request.authUser!.id);
  response.json(profile);
}
