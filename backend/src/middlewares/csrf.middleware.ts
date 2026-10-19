import crypto from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function issueCsrfCookie(_request: Request, response: Response) {
  const token = crypto.randomBytes(24).toString("hex");

  response.cookie("XSRF-TOKEN", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: env.NODE_ENV === "production"
  });

  response.status(204).send();
}

export function csrfMiddleware(request: Request, _response: Response, next: NextFunction) {
  if (!env.CSRF_ENABLED || SAFE_METHODS.has(request.method.toUpperCase())) {
    next();
    return;
  }

  const cookieToken = request.cookies?.["XSRF-TOKEN"];
  const headerToken =
    request.header("x-csrf-token") ??
    request.header("x-xsrf-token") ??
    request.header("X-CSRF-TOKEN");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError("Token CSRF tidak valid", 419));
    return;
  }

  next();
}
