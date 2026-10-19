import { randomUUID } from "node:crypto";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env, getTrustedOrigins } from "./env.js";
import { prisma } from "../lib/prisma.js";

const commonConfig = {
  appName: "Akara LMS",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  advanced: {
    database: {
      generateId: ({ model }: { model: string }) => {
        const normalizedModel = model.toLowerCase();
        if (normalizedModel === "user" || normalizedModel === "users") {
          return false;
        }
        return randomUUID();
      }
    }
  },
  emailAndPassword: {
    enabled: true
  },
  telemetry: {
    enabled: false
  }
};

export const studentAuth = betterAuth({
  ...commonConfig,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth/siswa",
  advanced: {
    ...commonConfig.advanced,
    cookiePrefix: "akara-siswa"
  }
});

export const teacherAuth = betterAuth({
  ...commonConfig,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth/guru",
  advanced: {
    ...commonConfig.advanced,
    cookiePrefix: "akara-guru"
  }
});

export const portalAuth = betterAuth({
  ...commonConfig,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth/portal",
  advanced: {
    ...commonConfig.advanced,
    cookiePrefix: "akara-elearning"
  }
});

// For backward compatibility or internal use
export const auth = studentAuth;
