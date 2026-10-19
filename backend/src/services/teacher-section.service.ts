import { prisma } from "../lib/prisma.js";
import { requireTeacherContext, requireTeacherOwnsOffering } from "./teacher-context.service.js";
import { toBigIntId } from "./lms-context.service.js";
import { AppError } from "../utils/app-error.js";

export async function createSection(userId: string, payload: { offeringId: string; judul: string; urutan?: number }) {
  const offeringId = toBigIntId(payload.offeringId, "Offering ID");
  await requireTeacherOwnsOffering(offeringId, userId);

  let urutan = payload.urutan;
  if (urutan === undefined) {
    const maxUrutan = await prisma.section.aggregate({
      where: { moduleStudentClassId: offeringId },
      _max: { urutan: true },
    });
    urutan = (maxUrutan._max.urutan ?? 0) + 1;
  }

  const section = await prisma.section.create({
    data: {
      moduleStudentClassId: offeringId,
      judul: payload.judul,
      urutan,
    },
  });

  return {
    id: String(section.id),
    title: section.judul,
    order: section.urutan,
  };
}

export async function updateSection(userId: string, sectionId: string, payload: { judul?: string; urutan?: number }) {
  const bigId = toBigIntId(sectionId, "Section ID");
  const teacher = await requireTeacherContext(userId);
  
  // Verify teacher owns the offering this section belongs to
  const section = await prisma.section.findUnique({
    where: { id: bigId },
    include: { moduleStudentClass: true }
  });

  if (!section || section.moduleStudentClass.teacherId !== teacher.id) {
    throw new AppError("Section tidak ditemukan atau tidak bisa diakses", 404);
  }

  const updated = await prisma.section.update({
    where: { id: bigId },
    data: {
      ...(payload.judul !== undefined && { judul: payload.judul }),
      ...(payload.urutan !== undefined && { urutan: payload.urutan }),
    },
  });

  return {
    id: String(updated.id),
    title: updated.judul,
    order: updated.urutan,
  };
}

export async function deleteSection(userId: string, sectionId: string) {
  const bigId = toBigIntId(sectionId, "Section ID");
  const teacher = await requireTeacherContext(userId);
  
  const section = await prisma.section.findUnique({
    where: { id: bigId },
    include: { moduleStudentClass: true }
  });

  if (!section || section.moduleStudentClass.teacherId !== teacher.id) {
    throw new AppError("Section tidak ditemukan atau tidak bisa diakses", 404);
  }

  // Optional: check if section has items? Or let prisma cascade/error
  await prisma.section.delete({ where: { id: bigId } });
  
  return { success: true };
}
