import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma.js";
import { requireTeacherContext, requireTeacherOwnsOffering } from "./teacher-context.service.js";
import { getNextMixedItemPosition } from "./item-position.service.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";
import { env } from "../config/env.js";

export type RubricPayload = {
  name: string;
  maxScore: number;
  urutan?: number;
};

export type TaskAttachmentPayload = {
  fileName: string;
  mimeType: string;
  base64Data: string;
};

export type CreateTaskPayload = {
  moduleStudentClassId: string;
  lessonId?: string;
  sectionId?: string;
  judul: string;
  deskripsi?: string;
  deadline: string;
  availableAt?: string;
  allowRevision?: boolean;
  isAktif?: boolean;
  status?: "draft" | "published";
  submitMethod?: "link" | "file" | "file_link";
  posisi?: number;
  attachment?: TaskAttachmentPayload;
  rubrics?: RubricPayload[];
};

export type UpdateTaskPayload = Partial<
  Omit<CreateTaskPayload, "moduleStudentClassId">
>;

async function resolveTaskLessonId(params: {
  offeringId: bigint;
  lessonId?: string;
}) {
  if (!params.lessonId) {
    throw new AppError("Materi acuan tugas belum dipilih", 422);
  }

  const lessonId = toBigIntId(params.lessonId, "Lesson ID");
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      moduleStudentClassId: params.offeringId,
    },
    select: {
      id: true,
      sectionId: true,
    },
  });

  if (!lesson) {
    throw new AppError("Materi acuan tugas tidak ditemukan pada mata pelajaran ini", 404);
  }

  return lesson;
}

async function resolveTaskPlacement(params: {
  offeringId: bigint;
  lessonId?: string;
  sectionId?: string;
}) {
  if (params.lessonId) {
    const lesson = await resolveTaskLessonId(params);

    if (params.sectionId) {
      const sectionId = toBigIntId(params.sectionId, "Section ID");
      if (lesson.sectionId !== sectionId) {
        throw new AppError("Materi acuan tidak berada pada bab yang dipilih", 422);
      }
    }

    return {
      lessonId: lesson.id,
      sectionId: lesson.sectionId,
    };
  }

  if (!params.sectionId) {
    throw new AppError("Bab tugas belum dipilih", 422);
  }

  const sectionId = toBigIntId(params.sectionId, "Section ID");
  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      moduleStudentClassId: params.offeringId,
    },
    select: { id: true },
  });

  if (!section) {
    throw new AppError("Bab tidak ditemukan pada mata pelajaran ini", 404);
  }

  return {
    lessonId: null,
    sectionId,
  };
}

async function saveTaskAttachment(attachment: TaskAttachmentPayload) {
  const uploadsDir = path.resolve(process.cwd(), "uploads", "tasks");
  await mkdir(uploadsDir, { recursive: true });

  const originalExtension = path.extname(attachment.fileName).toLowerCase();
  const safeExtension = originalExtension || guessExtensionFromMimeType(attachment.mimeType);
  const storedName = `${Date.now()}-${randomUUID()}${safeExtension}`;
  const absolutePath = path.join(uploadsDir, storedName);
  const normalizedBase64 = attachment.base64Data.replace(/^data:.+;base64,/, "");

  await writeFile(absolutePath, Buffer.from(normalizedBase64, "base64"));

  return {
    attachmentType: attachment.mimeType,
    attachmentPath: `/uploads/tasks/${storedName}`,
  };
}

function guessExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    default:
      return "";
  }
}

function buildPublicAttachmentUrl(attachmentPath: string) {
  return new URL(attachmentPath, env.BETTER_AUTH_URL).toString();
}

async function assertTeacherOwnsTask(taskId: bigint, userId: string) {
  const teacher = await requireTeacherContext(userId);
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      moduleStudentClass: { teacherId: teacher.id },
    },
    include: {
      rubrics: { orderBy: { urutan: "asc" } },
      lesson: { select: { sectionId: true } },
      section: { select: { id: true } },
    },
  });
  if (!task) throw new AppError("Tugas tidak ditemukan atau tidak bisa diakses", 404);
  return { teacher, task };
}

export async function createTask(userId: string, payload: CreateTaskPayload) {
  const offeringId = toBigIntId(payload.moduleStudentClassId, "ModuleStudentClass ID");
  await requireTeacherOwnsOffering(offeringId, userId);
  const placement = await resolveTaskPlacement({
    offeringId,
    lessonId: payload.lessonId,
    sectionId: payload.sectionId,
  });
  const posisi = await getNextMixedItemPosition(prisma, {
    offeringId,
    sectionId: placement.sectionId,
  });

  const task = await prisma.task.create({
    data: {
      modulesStudentClassId: offeringId,
      lessonId: placement.lessonId,
      posisi,
      sectionId: placement.sectionId,
      judul: payload.judul,
      deskripsi: payload.deskripsi ?? null,
      deadline: new Date(payload.deadline),
      availableAt: payload.availableAt ? new Date(payload.availableAt) : null,
      allowRevision: payload.allowRevision ?? false,
      isAktif: payload.isAktif ?? false,
      status: payload.status ?? "draft",
      submitMethod: payload.submitMethod ?? "link",
      ...(payload.attachment ? await saveTaskAttachment(payload.attachment) : {}),
      rubrics: payload.rubrics
        ? {
            create: payload.rubrics.map((r, idx) => ({
              name: r.name,
              maxScore: r.maxScore,
              urutan: r.urutan ?? idx + 1,
            })),
          }
        : undefined,
    },
    include: {
      rubrics: { orderBy: { urutan: "asc" } },
      lesson: { select: { sectionId: true } },
      section: { select: { id: true } },
    },
  });

  return formatTask(task, task.rubrics);
}

export async function updateTask(
  taskId: string,
  userId: string,
  payload: UpdateTaskPayload
) {
  const bigId = toBigIntId(taskId, "Task ID");
  const { task: currentTask } = await assertTeacherOwnsTask(bigId, userId);
  const nextPlacement =
    payload.lessonId !== undefined || payload.sectionId !== undefined
      ? await resolveTaskPlacement({
          offeringId: currentTask.modulesStudentClassId,
          lessonId: payload.lessonId,
          sectionId: payload.sectionId,
        })
      : null;
  const shouldReposition =
    payload.posisi === undefined &&
    nextPlacement !== null &&
    nextPlacement.sectionId !== currentTask.sectionId;
  const nextPosisi = shouldReposition
    ? await getNextMixedItemPosition(prisma, {
        offeringId: currentTask.modulesStudentClassId,
        sectionId: nextPlacement.sectionId,
      })
    : payload.posisi;

  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: bigId },
      include: {
        lesson: { select: { sectionId: true } },
        section: { select: { id: true } },
      },
      data: {
        ...(payload.judul !== undefined && { judul: payload.judul }),
        ...(payload.deskripsi !== undefined && { deskripsi: payload.deskripsi }),
        ...(payload.deadline !== undefined && { deadline: new Date(payload.deadline) }),
        ...(payload.availableAt !== undefined && {
          availableAt: payload.availableAt ? new Date(payload.availableAt) : null,
        }),
        ...(nextPlacement !== null && {
          lessonId: nextPlacement.lessonId,
          sectionId: nextPlacement.sectionId,
        }),
        ...(nextPosisi !== undefined && { posisi: nextPosisi }),
        ...(payload.allowRevision !== undefined && { allowRevision: payload.allowRevision }),
        ...(payload.isAktif !== undefined && { isAktif: payload.isAktif }),
        ...(payload.status !== undefined && { status: payload.status }),
        ...(payload.submitMethod !== undefined && { submitMethod: payload.submitMethod }),
        ...(payload.attachment ? await saveTaskAttachment(payload.attachment) : {}),
      },
    });

    // Jika rubrics diupdate, hapus semua lalu buat ulang
    if (payload.rubrics !== undefined) {
      await tx.taskRubric.deleteMany({ where: { taskId: bigId } });
      if (payload.rubrics.length > 0) {
        await tx.taskRubric.createMany({
          data: payload.rubrics.map((r, idx) => ({
            taskId: bigId,
            name: r.name,
            maxScore: r.maxScore,
            urutan: r.urutan ?? idx + 1,
          })),
        });
      }
    }

    const rubrics = await tx.taskRubric.findMany({
      where: { taskId: bigId },
      orderBy: { urutan: "asc" },
    });

    return { updated, rubrics };
  });

  return formatTask(task.updated, task.rubrics);
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  isAktif: boolean,
  status?: "draft" | "published"
) {
  const bigId = toBigIntId(taskId, "Task ID");
  await assertTeacherOwnsTask(bigId, userId);

  const updated = await prisma.task.update({
    where: { id: bigId },
    include: {
      lesson: { select: { sectionId: true } },
      section: { select: { id: true } },
      rubrics: { orderBy: { urutan: "asc" } },
    },
    data: {
      isAktif,
      ...(status !== undefined && { status }),
    },
  });

  return formatTask(updated, updated.rubrics);
}

export async function deleteTask(taskId: string, userId: string) {
  const bigId = toBigIntId(taskId, "Task ID");
  await assertTeacherOwnsTask(bigId, userId);
  await prisma.task.delete({ where: { id: bigId } });
  return { success: true };
}

export async function getTaskById(taskId: string, userId: string) {
  const bigId = toBigIntId(taskId, "Task ID");
  const { task } = await assertTeacherOwnsTask(bigId, userId);
  return formatTask(task, task.rubrics);
}

function formatTask(
  task: {
    id: bigint;
    judul: string;
    deskripsi: string | null;
    deadline: Date;
    availableAt: Date | null;
    allowRevision: boolean;
    isAktif: boolean;
    status: string;
    submitMethod: string;
    modulesStudentClassId: bigint;
    lessonId: bigint | null;
    posisi: number;
    sectionId: bigint | null;
    attachmentType?: string | null;
    attachmentPath?: string | null;
    lesson?: {
      sectionId: bigint | null;
    } | null;
    section?: {
      id: bigint;
    } | null;
  },
  rubrics: {
    id: bigint;
    name: string;
    maxScore: number;
    urutan: number;
  }[]
) {
  return {
    id: String(task.id),
    title: task.judul,
    description: task.deskripsi ?? "",
    deadline: task.deadline.toISOString(),
    availableAt: task.availableAt?.toISOString() ?? null,
    allowRevision: task.allowRevision,
    isActive: task.isAktif,
    status: task.status,
    submitMethod: task.submitMethod,
    moduleStudentClassId: String(task.modulesStudentClassId),
    lessonId: task.lessonId ? String(task.lessonId) : null,
    position: task.posisi,
    sectionId: task.sectionId ? String(task.sectionId) : null,
    attachment:
      task.attachmentPath && task.attachmentType
        ? {
            fileName: path.basename(task.attachmentPath),
            mimeType: task.attachmentType,
            url: buildPublicAttachmentUrl(task.attachmentPath),
          }
        : null,
    rubrics: rubrics.map((r) => ({
      id: String(r.id),
      name: r.name,
      maxScore: r.maxScore,
      order: r.urutan,
    })),
  };
}
