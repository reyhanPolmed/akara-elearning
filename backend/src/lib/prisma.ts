import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __akaraPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__akaraPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__akaraPrisma__ = prisma;
}
