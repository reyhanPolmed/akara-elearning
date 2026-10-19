import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { requireTeacherContext, requireTeacherOwnsOffering } from "./teacher-context.service.js";
import { getNextMixedItemPosition } from "./item-position.service.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";

type LessonContentFilePayload = {
  fileName: string;
  mimeType: string;
  base64Data: string;
};

export type CreateLessonPayload = {
  moduleStudentClassId: string;
  sectionId?: string;
  judul: string;
  tipeKonten: "text" | "video" | "pdf" | "link";
  konten: string;
  urlKonten?: string;
  contentFile?: LessonContentFilePayload;
  durasi?: number;
  tersediaPada?: string;
  posisi?: number;
  status?: "draft" | "published";
};

export type UpdateLessonPayload = Partial<Omit<CreateLessonPayload, "moduleStudentClassId">>;

function guessExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    default:
      return "";
  }
}

async function saveLessonContentFile(attachment: LessonContentFilePayload) {
  const uploadsDir = path.resolve(process.cwd(), "uploads", "lessons");
  await mkdir(uploadsDir, { recursive: true });

  const originalExtension = path.extname(attachment.fileName).toLowerCase();
  const safeExtension = originalExtension || guessExtensionFromMimeType(attachment.mimeType);
  const storedName = `${Date.now()}-${randomUUID()}${safeExtension}`;
  const absolutePath = path.join(uploadsDir, storedName);
  const normalizedBase64 = attachment.base64Data.replace(/^data:.+;base64,/, "");

  await writeFile(absolutePath, Buffer.from(normalizedBase64, "base64"));

  return `/uploads/lessons/${storedName}`;
}

function buildPublicContentUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return new URL(value, env.BETTER_AUTH_URL).toString();
}

async function assertTeacherOwnsLesson(lessonId: bigint, userId: string) {
  const teacher = await requireTeacherContext(userId);
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      moduleStudentClass: { teacherId: teacher.id },
    },
  });
  if (!lesson) throw new AppError("Materi tidak ditemukan atau tidak bisa diakses", 404);
  return { teacher, lesson };
}

export async function createLesson(userId: string, payload: CreateLessonPayload) {
  const offeringId = toBigIntId(payload.moduleStudentClassId, "ModuleStudentClass ID");
  await requireTeacherOwnsOffering(offeringId, userId);

  // Auto-calculate posisi
  let posisi = payload.posisi;
  if (!posisi) {
    posisi = await getNextMixedItemPosition(prisma, {
      offeringId,
      sectionId: payload.sectionId ? toBigIntId(payload.sectionId) : null,
    });
  }

  const nextContentUrl = payload.contentFile
    ? await saveLessonContentFile(payload.contentFile)
    : payload.urlKonten ?? null;

  const lesson = await prisma.lesson.create({
    data: {
      moduleStudentClassId: offeringId,
      sectionId: payload.sectionId ? toBigIntId(payload.sectionId) : null,
      judul: payload.judul,
      tipeKonten: payload.tipeKonten,
      konten: payload.konten,
      urlKonten: nextContentUrl,
      durasi: payload.durasi ?? null,
      tersediaPada: payload.tersediaPada ? new Date(payload.tersediaPada) : null,
      posisi,
      status: payload.status ?? "draft",
      urutan: posisi,
    },
  });

  return formatLesson(lesson);
}

export async function updateLesson(
  lessonId: string,
  userId: string,
  payload: UpdateLessonPayload
) {
  const bigId = toBigIntId(lessonId, "Lesson ID");
  const { lesson } = await assertTeacherOwnsLesson(bigId, userId);
  const nextContentUrl = payload.contentFile
    ? await saveLessonContentFile(payload.contentFile)
    : payload.urlKonten;
  const nextSectionId =
    payload.sectionId !== undefined
      ? payload.sectionId
        ? toBigIntId(payload.sectionId)
        : null
      : lesson.sectionId;
  const shouldReposition =
    payload.posisi === undefined &&
    payload.sectionId !== undefined &&
    nextSectionId !== lesson.sectionId;
  const nextPosisi = shouldReposition
    ? await getNextMixedItemPosition(prisma, {
        offeringId: lesson.moduleStudentClassId,
        sectionId: nextSectionId,
      })
    : payload.posisi;

  const updated = await prisma.lesson.update({
    where: { id: bigId },
    data: {
      ...(payload.judul !== undefined && { judul: payload.judul }),
      ...(payload.tipeKonten !== undefined && { tipeKonten: payload.tipeKonten }),
      ...(payload.konten !== undefined && { konten: payload.konten }),
      ...(nextContentUrl !== undefined && { urlKonten: nextContentUrl }),
      ...(payload.durasi !== undefined && { durasi: payload.durasi }),
      ...(payload.tersediaPada !== undefined && {
        tersediaPada: payload.tersediaPada ? new Date(payload.tersediaPada) : null,
      }),
      ...(nextPosisi !== undefined && { posisi: nextPosisi, urutan: nextPosisi }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.sectionId !== undefined && {
        sectionId: payload.sectionId ? toBigIntId(payload.sectionId) : null,
      }),
    },
  });

  return formatLesson(updated);
}

export async function publishLesson(lessonId: string, userId: string, status: "draft" | "published") {
  const bigId = toBigIntId(lessonId, "Lesson ID");
  await assertTeacherOwnsLesson(bigId, userId);

  const updated = await prisma.lesson.update({
    where: { id: bigId },
    data: { status },
  });

  return formatLesson(updated);
}

export async function deleteLesson(lessonId: string, userId: string) {
  const bigId = toBigIntId(lessonId, "Lesson ID");
  await assertTeacherOwnsLesson(bigId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.task.updateMany({
      where: { lessonId: bigId },
      data: { lessonId: null },
    });

    await tx.quiz.updateMany({
      where: { lessonId: bigId },
      data: { lessonId: null },
    });

    await tx.lesson.delete({ where: { id: bigId } });
  });

  return { success: true };
}

export async function getLessonById(lessonId: string, userId: string) {
  const bigId = toBigIntId(lessonId, "Lesson ID");
  const { lesson } = await assertTeacherOwnsLesson(bigId, userId);
  return formatLesson(lesson);
}

function formatLesson(lesson: {
  id: bigint;
  judul: string;
  tipeKonten: string;
  konten: string;
  urlKonten: string | null;
  durasi: number | null;
  posisi: number;
  status: string;
  tersediaPada: Date | null;
  sectionId: bigint | null;
  moduleStudentClassId: bigint;
}) {
  return {
    id: String(lesson.id),
    title: lesson.judul,
    contentType: lesson.tipeKonten,
    body: lesson.konten,
    contentUrl: buildPublicContentUrl(lesson.urlKonten),
    durationMinutes: lesson.durasi,
    position: lesson.posisi,
    status: lesson.status,
    availableAt: lesson.tersediaPada?.toISOString() ?? null,
    sectionId: lesson.sectionId ? String(lesson.sectionId) : null,
    moduleStudentClassId: String(lesson.moduleStudentClassId),
  };
}
