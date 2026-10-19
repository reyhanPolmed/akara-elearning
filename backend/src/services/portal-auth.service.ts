import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";

export type PortalRole = "mahasiswa" | "dosen";

type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

const defaultRedirectByRole: Record<PortalRole, string> = {
  mahasiswa: "/mahasiswa/dashboard",
  dosen: "/dosen/dashboard"
};

export async function resolvePortalSessionUser(user: AuthUser) {
  const userId = toBigIntId(user.id, "User ID");
  const [mahasiswaProfile, dosenProfile] = await Promise.all([
    prisma.student.findFirst({
      where: {
        userId
      },
      select: {
        nama: true,
        email: true
      }
    }),
    prisma.teacher.findFirst({
      where: {
        userId
      },
      select: {
        nama: true,
        email: true
      }
    })
  ]);
  const roles: PortalRole[] = [];

  if (mahasiswaProfile) {
    roles.push("mahasiswa");
  }

  if (dosenProfile) {
    roles.push("dosen");
  }

  if (roles.length === 0) {
    throw new AppError("Akun ini belum memiliki akses portal", 403);
  }

  const activeRole = roles[0]!;
  const primaryProfile = activeRole === "dosen" ? dosenProfile : mahasiswaProfile;

  return {
    id: String(user.id),
    name: primaryProfile?.nama ?? user.name ?? "",
    email: primaryProfile?.email ?? user.email ?? "",
    roles,
    activeRole,
    redirectTo: roles.length > 1 ? "/pilih-peran" : defaultRedirectByRole[activeRole]
  };
}
