import type { Request } from "express";

export function buildHeaders(request: Request) {
  const headers = new Headers();

  for (const [key, rawValue] of Object.entries(request.headers)) {
    if (typeof rawValue === "undefined") {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        headers.append(key, value);
      }
      continue;
    }

    headers.set(key, rawValue);
  }

  return headers;
}
