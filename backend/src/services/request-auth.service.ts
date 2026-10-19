import type { Request } from "express";
import type { Session, User } from "better-auth";

import { buildHeaders } from "../utils/request-headers.js";

type AuthSessionResult = {
  session: Session;
  user: User;
};

type AuthInstance = {
  api: {
    getSession: (input: { headers: Headers }) => Promise<AuthSessionResult | null | undefined>;
  };
};

export async function resolveRequestAuthSession(
  request: Request,
  authInstances: AuthInstance[]
) {
  for (const authInstance of authInstances) {
    const sessionResult = await authInstance.api.getSession({
      headers: buildHeaders(request),
    });

    if (sessionResult?.session && sessionResult.user) {
      return sessionResult;
    }
  }

  return null;
}
