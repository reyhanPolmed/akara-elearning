import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { listStudentModules } from "./module.service.js";
import { requireStudentContext, toBigIntId } from "./lms-context.service.js";

export async function getStudentProfile(userId: string) {
  const student = await requireStudentContext(userId);
  const modules = await listStudentModules(userId);
  const weeklyProgress = modules.length > 0
    ? Math.round(
        modules.reduce((total, item) => total + (item.completionRate ?? 0), 0) / modules.length
      )
    : 0;

  return {
    id: String(student.user.id),
    fullName: student.user.name,
    email: student.user.email ?? "",
    className: student.kelas.namaKelas,
    department: student.kelas.jurusan?.namaJurusan ?? student.jurusan?.namaJurusan ?? "",
    weeklyProgress,
    phone: student.hpOrangTua ?? "",
    bio: "",
    nisn: student.nisn
  };
}

export async function updateStudentProfile(
  userId: string,
  payload: {
    fullName: string;
    email: string;
    phone?: string;
    bio?: string;
  }
) {
  const normalizedUserId = toBigIntId(userId, "User ID");
  const student = await requireStudentContext(userId);
  const emailOwner = await prisma.user.findFirst({
    where: {
      email: payload.email,
      id: {
        not: normalizedUserId
      }
    }
  });

  if (emailOwner) {
    throw new AppError("Email sudah digunakan akun lain", 409);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: normalizedUserId
      },
      data: {
        name: payload.fullName,
        email: payload.email
      }
    }),
    prisma.student.update({
      where: {
        id: student.id
      },
      data: {
        nama: payload.fullName,
        email: payload.email,
        hpOrangTua: payload.phone || null
      }
    })
  ]);

  return getStudentProfile(userId);
}
