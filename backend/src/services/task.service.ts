import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { SubmissionStatus } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import {
  buildSequentialSidebar,
  ensureStringArray,
  requireStudentContext,
  toBigIntId
} from "./lms-context.service.js";
import { AppError } from "../utils/app-error.js";
import {
  buildOriginalitySummary,
  enqueueTaskSubmissionSimilarityCheck
} from "./winnowing.service.js";

async function getTaskGraph(taskId: string, userId: string) {
  const student = await requireStudentContext(userId);
  const task = await prisma.task.findFirst({
    where: {
      id: toBigIntId(taskId, "Task ID"),
      isAktif: true,
      status: "published",
      moduleStudentClass: {
        studentClassId: student.kelas.id,
        module: {
          isAktif: true
        }
      }
    },
    include: {
      submissions: {
        where: {
          userId: student.userId
        },
        include: {
          similarityCheck: true
        },
        take: 1
      },
      lesson: true,
      moduleStudentClass: {
        include: {
          sections: {
            orderBy: {
              urutan: "asc"
            }
          },
          lessons: {
            where: {
              status: "published"
            },
            orderBy: {
              posisi: "asc"
            },
            include: {
              lessonUsers: {
                where: {
                  userId: student.userId
                }
              }
            }
          },
          quizzes: {
            where: {
              isAktif: true,
              sectionId: {
                not: null
              }
            },
            orderBy: {
              posisi: "asc"
            },
            include: {
              attempts: {
                where: {
                  userId: student.userId,
                  submittedAt: {
                    not: null
                  }
                },
                take: 1
              }
            }
          },
      tasks: {
        where: {
          isAktif: true,
          status: "published"
        },
        orderBy: {
          posisi: "asc"
        },
        include: {
          submissions: {
            where: {
              userId: student.userId
                },
                take: 1
              }
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw new AppError("Tugas tidak ditemukan", 404);
  }

  return task;
}

function buildPublicAttachment(task: {
  attachmentPath: string | null;
  attachmentType: string | null;
}) {
  if (!task.attachmentPath || !task.attachmentType) return undefined;

  return {
    fileName: path.basename(task.attachmentPath),
    mimeType: task.attachmentType,
    url: new URL(task.attachmentPath, env.BETTER_AUTH_URL).toString(),
  };
}

async function saveTaskSubmissionFile(attachment: {
  fileName: string;
  mimeType: string;
  base64Data: string;
}) {
  const uploadsDir = path.resolve(process.cwd(), "uploads", "task-submissions");
  await mkdir(uploadsDir, { recursive: true });

  const extension = path.extname(attachment.fileName).toLowerCase();
  const storedName = `${Date.now()}-${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadsDir, storedName);
  const normalizedBase64 = attachment.base64Data.replace(/^data:.+;base64,/, "");

  await writeFile(absolutePath, Buffer.from(normalizedBase64, "base64"));

  return {
    submissionFilePath: `/uploads/task-submissions/${storedName}`,
    submissionFileType: attachment.mimeType,
  };
}

function buildSubmissionFile(submission: {
  submissionFilePath: string | null;
  submissionFileType: string | null;
}) {
  if (!submission.submissionFilePath || !submission.submissionFileType) return undefined;

  return {
    fileName: path.basename(submission.submissionFilePath),
    mimeType: submission.submissionFileType,
    url: new URL(submission.submissionFilePath, env.BETTER_AUTH_URL).toString(),
  };
}

export async function getStudentTaskDetail(taskId: string, userId: string) {
  const task = await getTaskGraph(taskId, userId);
  const { sidebar } = buildSequentialSidebar({
    sections: task.moduleStudentClass.sections.map((section) => ({
      id: section.id,
      title: section.judul,
      description: null,
      order: section.urutan
    })),
    lessons: task.moduleStudentClass.lessons.map((item) => ({
      id: item.id,
      title: item.judul,
      type: "lesson" as const,
      sectionId: item.sectionId,
      position: item.posisi,
      createdAt: item.createdAt,
      href: `/lessons/${item.id}`,
      availableAt: item.tersediaPada,
      isCompleted: item.lessonUsers.some((progress) => progress.isCompleted)
    })),
    quizzes: task.moduleStudentClass.quizzes.map((item) => ({
      id: item.id,
      title: item.judul,
      type: "quiz" as const,
      sectionId: item.sectionId,
      position: item.posisi,
      createdAt: item.createdAt,
      href: `/quizzes/${item.id}`,
      availableAt: item.availableAt,
      isCompleted: item.attempts.length > 0
    })),
    tasks: task.moduleStudentClass.tasks.map((item) => ({
      id: item.id,
      title: item.judul,
      type: "task" as const,
      sectionId: item.sectionId,
      position: item.posisi,
      createdAt: item.createdAt,
      href: `/tasks/${item.id}`,
      availableAt: item.availableAt,
      isCompleted: item.submissions.length > 0
    }))
  });

  const currentSubmission = task.submissions[0];

  return {
    id: String(task.id),
    courseId: String(task.moduleStudentClass.id),
    title: task.judul,
    description: task.deskripsi ?? "",
    dueAt: task.deadline.toISOString(),
    allowRevision: task.allowRevision,
    submitMethod: (task.submitMethod as "link" | "file" | "file_link") ?? "link",
    attachment: buildPublicAttachment(task),
    currentSubmission: currentSubmission
      ? {
          link: currentSubmission.submissionLink ?? undefined,
          file: buildSubmissionFile(currentSubmission),
          status: currentSubmission.status.toLowerCase(),
          originalityCheck: buildOriginalitySummary(currentSubmission.similarityCheck),
          teacherNote: currentSubmission.teacherNote ?? undefined,
          submittedAt: currentSubmission.submittedAt?.toISOString() ?? null
        }
      : undefined,
    sidebar,
    checklist: ensureStringArray(null, [
      "Pastikan link submission dapat diakses.",
      "Gunakan format nama file yang konsisten.",
      "Periksa deadline sebelum mengirim."
    ])
  };
}

export async function submitTaskSubmission(
  taskId: string,
  userId: string,
  payload: {
    submissionLink?: string;
    submissionFile?: {
      fileName: string;
      mimeType: string;
      base64Data: string;
    };
  }
) {
  const student = await requireStudentContext(userId);
  const task = await getTaskGraph(taskId, userId);
  const currentSubmission = task.submissions[0];
  const submitMethod = (task.submitMethod as "link" | "file" | "file_link") ?? "link";
  const trimmedLink = payload.submissionLink?.trim();

  if (submitMethod === "link" && !trimmedLink) {
    throw new AppError("Link submission wajib diisi", 422);
  }

  if (submitMethod === "file" && !payload.submissionFile) {
    throw new AppError("File submission wajib diunggah", 422);
  }

  if (submitMethod === "file_link") {
    if (!trimmedLink) {
      throw new AppError("Link submission wajib diisi", 422);
    }
    if (!payload.submissionFile) {
      throw new AppError("File submission wajib diunggah", 422);
    }
  }

  const nextSubmissionFile = payload.submissionFile
    ? await saveTaskSubmissionFile(payload.submissionFile)
    : {};

  if (currentSubmission && !task.allowRevision) {
    throw new AppError("Tugas ini tidak mengizinkan revisi", 422);
  }

  const savedSubmission = currentSubmission
    ? await prisma.taskSubmission.update({
      where: {
        id: currentSubmission.id
      },
      data: {
        submissionLink: trimmedLink ?? null,
        ...nextSubmissionFile,
        submittedAt: new Date(),
        status: SubmissionStatus.SUBMITTED,
        teacherNote: null
      }
    })
    : await prisma.taskSubmission.create({
      data: {
        taskId: task.id,
        userId: student.userId,
        submissionLink: trimmedLink ?? null,
        ...nextSubmissionFile,
        submittedAt: new Date(),
        status: SubmissionStatus.SUBMITTED
      }
    });

  await enqueueTaskSubmissionSimilarityCheck(savedSubmission.id);

  return getStudentTaskDetail(taskId, userId);
}
