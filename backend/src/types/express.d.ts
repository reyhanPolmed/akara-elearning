import type { Session, User } from "better-auth";

declare global {
  namespace Express {
    interface Request {
      authSession?: Session;
      authUser?: User;
      csrfTokenValue?: string;
    }
  }
}

export {};
