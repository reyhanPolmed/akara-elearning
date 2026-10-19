import crypto from "node:crypto";
import type { Request, Response } from "express";

import { hashPassword } from "@better-auth/utils/password";
import { z } from "zod";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const syncTeacherCredentialSchema = z.object({
  userId: z.union([z.string(), z.number()]).transform((value) => BigInt(value)),
  email: z.string().email("Email tidak valid").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password wajib diisi").optional(),
});

export async function syncTeacherCredentialController(request: Request, response: Response) {
  const providedSecret = request.header("x-internal-auth-secret");
  const requestIp = request.ip ?? request.socket.remoteAddress ?? "";
  const isLocalRequest =
    requestIp === "::1" ||
    requestIp === "127.0.0.1" ||
    requestIp === "::ffff:127.0.0.1";

  if (!isLocalRequest && (!providedSecret || providedSecret !== env.BETTER_AUTH_SECRET)) {
    throw new AppError("Unauthorized", 401);
  }

  const payload = syncTeacherCredentialSchema.parse(request.body);

  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: payload.userId,
      providerId: "credential",
    },
  });

  if (!existingAccount && !payload.password) {
    throw new AppError("Password wajib diisi untuk membuat credential baru", 422);
  }

  const passwordHash = payload.password
    ? await hashPassword(payload.password)
    : existingAccount!.password;

  if (!existingAccount) {
    const createdAccount = await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: payload.userId,
        accountId: payload.email,
        providerId: "credential",
        password: passwordHash,
      },
    });

    response.json({
      ok: true,
      accountId: createdAccount.id,
      accountIdentifier: createdAccount.accountId,
    });
    return;
  }

  const updatedAccount = await prisma.account.update({
    where: {
      id: existingAccount.id,
    },
    data: {
      accountId: payload.email,
      password: passwordHash,
    },
  });

  response.json({
    ok: true,
    accountId: updatedAccount.id,
    accountIdentifier: updatedAccount.accountId,
  });
}
