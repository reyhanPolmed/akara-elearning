import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";

export async function requireTeacherContext(userId: string) {
  const normalizedUserId = toBigIntId(userId, "User ID");

  const teacher = await prisma.teacher.findFirst({
    where: { userId: normalizedUserId },
    include: {
      user: true,
      jurusan: true,
      moduleClasses: {
        include: {
          module: true,
          studentClass: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new AppError("Akun ini tidak terhubung ke profil dosen", 403);
  }

  return teacher;
}

export async function requireTeacherOwnsOffering(
  offeringId: bigint,
  userId: string
) {
  const teacher = await requireTeacherContext(userId);
  const offering = await prisma.moduleStudentClass.findFirst({
    where: { id: offeringId, teacherId: teacher.id },
  });

  if (!offering) {
    throw new AppError("Anda tidak memiliki akses ke mata pelajaran ini", 403);
  }

  return { teacher, offering };
}
