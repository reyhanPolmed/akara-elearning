import { SubmissionStatus } from "@prisma/client";
import path from "node:path";

import { prisma } from "../lib/prisma.js";
import { requireTeacherContext } from "./teacher-context.service.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";
import { env } from "../config/env.js";
import { buildOriginalitySummary, syncSimilaritySummaryFromPairs } from "./winnowing.service.js";

function getQuizReviewStatus(retakeRequested: boolean) {
  return retakeRequested ? "retake" : "graded";
}

function getQuestionOptionLabel(
  question: {
    opsiA: string;
    opsiB: string;
    opsiC: string;
    opsiD: string;
  },
  optionKey: string | null | undefined
) {
  switch (optionKey) {
    case "A":
      return question.opsiA;
    case "B":
      return question.opsiB;
    case "C":
      return question.opsiC;
    case "D":
      return question.opsiD;
    default:
      return null;
  }
}

function buildQuestionWeights(questionCount: number) {
  if (questionCount <= 0) return [];

  const baseWeight = Math.floor(100 / questionCount);
  const remainder = 100 % questionCount;

  return Array.from({ length: questionCount }, (_, index) =>
    baseWeight + (index < remainder ? 1 : 0)
  );
}

// ─── Task Review ─────────────────────────────────────────────────────────────

export async function listTaskSubmissions(
  taskId: string,
  userId: string,
  filters?: { classId?: string; status?: string }
) {
  const teacher = await requireTeacherContext(userId);
  const bigTaskId = toBigIntId(taskId, "Task ID");

  // Pastikan task milik guru
  const task = await prisma.task.findFirst({
    where: { id: bigTaskId, moduleStudentClass: { teacherId: teacher.id } },
  });
  if (!task) throw new AppError("Tugas tidak ditemukan atau tidak bisa diakses", 404);

  const submissions = await prisma.taskSubmission.findMany({
    where: {
      taskId: bigTaskId,
      ...(filters?.status && {
        status: filters.status.toUpperCase() as SubmissionStatus,
      }),
    },
    include: {
      user: {
        include: {
          students: {
            include: { kelas: true },
          },
        },
      },
      rubricScores: { include: { rubric: true } },
      similarityCheck: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions
    .filter((sub) => {
      if (!filters?.classId) return true;
      return sub.user.students[0]?.kelas?.id === toBigIntId(filters.classId);
    })
    .map((sub) => {
      const student = sub.user.students[0];
      return {
        id: String(sub.id),
        studentName: sub.user.name,
        className: student?.kelas?.namaKelas ?? "-",
        submittedAt: sub.submittedAt?.toISOString() ?? null,
        status: sub.status.toLowerCase(),
        score: sub.score ?? null,
        teacherFeedback: sub.teacherFeedback ?? "",
        originalityCheck: buildOriginalitySummary(sub.similarityCheck),
      };
    });
}

export async function getTaskSubmissionDetail(
  submissionId: string,
  userId: string
) {
  const teacher = await requireTeacherContext(userId);
  const bigId = toBigIntId(submissionId, "Submission ID");

  const sub = await prisma.taskSubmission.findFirst({
    where: {
      id: bigId,
      task: { moduleStudentClass: { teacherId: teacher.id } },
    },
    include: {
      user: {
        include: {
          students: { include: { kelas: true } },
        },
      },
      task: {
        include: {
          moduleStudentClass: { include: { module: true } },
          rubrics: { orderBy: { urutan: "asc" } },
        },
      },
      rubricScores: { include: { rubric: true } },
      similarityCheck: true,
    },
  });

  if (!sub) throw new AppError("Submission tidak ditemukan atau tidak bisa diakses", 404);

  const student = sub.user.students[0];

  let check = sub.similarityCheck;
  if (check && check.similarityStatus === "completed" && check.similarityDocumentId) {
    try {
      check = await syncSimilaritySummaryFromPairs(check);
    } catch (error) {
      // Silently fallback if Winnowing API is offline
    }
  }

  return {
    id: String(sub.id),
    studentName: sub.user.name,
    className: student?.kelas?.namaKelas ?? "-",
    courseTitle: sub.task.moduleStudentClass.module.judul,
    assignmentTitle: sub.task.judul,
    submittedAt: sub.submittedAt?.toISOString() ?? null,
    status: sub.status.toLowerCase(),
    score: sub.score ?? null,
    submissionLink: sub.submissionLink ?? "",
    submissionFile:
      sub.submissionFilePath && sub.submissionFileType
        ? {
            fileName: path.basename(sub.submissionFilePath),
            mimeType: sub.submissionFileType,
            url: new URL(sub.submissionFilePath, env.BETTER_AUTH_URL).toString(),
          }
        : null,
    teacherFeedback: sub.teacherFeedback ?? "",
    teacherNote: sub.teacherNote ?? "",
    originalityCheck: buildOriginalitySummary(check),
    rubrics: sub.task.rubrics.map((r) => {
      const rubricScore = sub.rubricScores.find(
        (rs) => rs.rubricId === r.id
      );
      return {
        id: String(r.id),
        name: r.name,
        maxScore: r.maxScore,
        score: rubricScore?.score ?? null,
      };
    }),
  };
}

export async function gradeTaskSubmission(
  submissionId: string,
  userId: string,
  payload: {
    score?: number;
    rubricScores?: { rubricId: string; score: number }[];
    teacherFeedback?: string;
    action: "draft" | "revision" | "publish";
  }
) {
  const teacher = await requireTeacherContext(userId);
  const bigId = toBigIntId(submissionId, "Submission ID");

  const sub = await prisma.taskSubmission.findFirst({
    where: {
      id: bigId,
      task: { moduleStudentClass: { teacherId: teacher.id } },
    },
    include: { task: { include: { rubrics: true } } },
  });

  if (!sub) throw new AppError("Submission tidak ditemukan atau tidak bisa diakses", 404);

  const hasDirectScore = typeof payload.score === "number";
  const hasRubricScores = (payload.rubricScores?.length ?? 0) > 0;
  const finalScore = hasDirectScore
    ? Math.max(0, Math.min(100, Math.round(payload.score!)))
    : hasRubricScores
      ? (() => {
          const totalScore = payload.rubricScores!.reduce((acc, rs) => acc + rs.score, 0);
          const maxScore = sub.task.rubrics.reduce((acc, r) => acc + r.maxScore, 0);
          return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null;
        })()
      : sub.score;

  const newStatus =
    payload.action === "publish"
      ? SubmissionStatus.GRADED
      : payload.action === "revision"
        ? SubmissionStatus.REVISED
        : sub.status;

  await prisma.$transaction(async (tx) => {
    // Update submission
    await tx.taskSubmission.update({
      where: { id: bigId },
      data: {
        status: newStatus,
        score: finalScore,
        teacherFeedback: payload.teacherFeedback ?? sub.teacherFeedback,
      },
    });

    // Upsert rubric scores
    for (const rs of payload.rubricScores ?? []) {
      const rubricId = toBigIntId(rs.rubricId, "Rubric ID");
      await tx.taskSubmissionRubricScore.upsert({
        where: {
          submissionId_rubricId: {
            submissionId: bigId,
            rubricId,
          },
        },
        create: {
          submissionId: bigId,
          rubricId,
          score: rs.score,
        },
        update: {
          score: rs.score,
        },
      });
    }
  });

  return getTaskSubmissionDetail(submissionId, userId);
}

// ─── Quiz Review ─────────────────────────────────────────────────────────────

export async function listQuizSubmissions(
  quizId: string,
  userId: string,
  filters?: { status?: string; scope?: string }
) {
  const teacher = await requireTeacherContext(userId);
  const bigQuizId = toBigIntId(quizId, "Quiz ID");

  const quiz = await prisma.quiz.findFirst({
    where: { id: bigQuizId, moduleStudentClass: { teacherId: teacher.id } },
  });
  if (!quiz) throw new AppError("Kuis tidak ditemukan atau tidak bisa diakses", 404);

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: bigQuizId,
      submittedAt: { not: null },
      ...(filters?.status === "retake" && { retakeRequested: true }),
      ...(filters?.status === "graded" && { retakeRequested: false }),
    },
    include: {
      user: {
        include: { students: { include: { kelas: true } } },
      },
      quiz: {
        include: {
          moduleStudentClass: { include: { module: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const attemptsByStudent = new Map<string, typeof attempts[number]>();
  const orderedAttempts =
    filters?.scope === "all"
      ? attempts
      : attempts.filter((attempt) => {
          const studentKey = attempt.userId.toString();
          if (attemptsByStudent.has(studentKey)) {
            return false;
          }

          attemptsByStudent.set(studentKey, attempt);
          return true;
        });
  const attemptNumberMap = new Map<string, number>();
  const perStudentCounters = new Map<string, number>();

  [...attempts]
    .sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
    .forEach((attempt) => {
      const studentKey = attempt.userId.toString();
      const nextAttemptNumber = (perStudentCounters.get(studentKey) ?? 0) + 1;
      perStudentCounters.set(studentKey, nextAttemptNumber);
      attemptNumberMap.set(attempt.id.toString(), nextAttemptNumber);
    });

  return orderedAttempts.map((a) => {
    const student = a.user.students[0];
    return {
      id: String(a.id),
      attemptNumber: attemptNumberMap.get(a.id.toString()) ?? 1,
      studentName: a.user.name,
      className: student?.kelas?.namaKelas ?? "-",
      courseTitle: a.quiz.moduleStudentClass.module.judul,
      assignmentTitle: a.quiz.judul,
      score: a.score ?? null,
      status: getQuizReviewStatus(a.retakeRequested),
      submittedAt: a.submittedAt?.toISOString() ?? null,
    };
  });
}

export async function getQuizAttemptDetail(attemptId: string, userId: string) {
  const teacher = await requireTeacherContext(userId);
  const bigId = toBigIntId(attemptId, "Attempt ID");

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: bigId,
      quiz: { moduleStudentClass: { teacherId: teacher.id } },
    },
    include: {
      user: {
        include: { students: { include: { kelas: true } } },
      },
      quiz: {
        include: {
          moduleStudentClass: { include: { module: true } },
          questions: true,
        },
      },
      answers: {
        include: { question: true },
      },
    },
  });

  if (!attempt) throw new AppError("Attempt kuis tidak ditemukan", 404);

  const student = attempt.user.students[0];
  const questionWeights = buildQuestionWeights(attempt.quiz.questions.length);
  const historyRows = await prisma.quizAttempt.findMany({
    where: {
      quizId: attempt.quizId,
      userId: attempt.userId,
      submittedAt: { not: null },
    },
    orderBy: { startedAt: "asc" },
  });
  const attemptHistory = historyRows
    .map((row, index) => ({
      id: String(row.id),
      attemptNumber: index + 1,
      score: row.score ?? null,
      status: getQuizReviewStatus(row.retakeRequested),
      submittedAt: row.submittedAt?.toISOString() ?? null,
      isLatest: row.id === attempt.id,
    }))
    .sort((left, right) => {
      const leftTime = left.submittedAt ? new Date(left.submittedAt).getTime() : 0;
      const rightTime = right.submittedAt ? new Date(right.submittedAt).getTime() : 0;
      return rightTime - leftTime;
    });
  const attemptNumber =
    historyRows.findIndex((row) => row.id === attempt.id) >= 0
      ? historyRows.findIndex((row) => row.id === attempt.id) + 1
      : 1;

  return {
    id: String(attempt.id),
    attemptNumber,
    studentName: attempt.user.name,
    className: student?.kelas?.namaKelas ?? "-",
    courseTitle: attempt.quiz.moduleStudentClass.module.judul,
    assignmentTitle: attempt.quiz.judul,
    status: getQuizReviewStatus(attempt.retakeRequested),
    score: attempt.score ?? null,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    attemptHistory,
    questions: attempt.quiz.questions.map((q, index) => {
      const answer = attempt.answers.find(
        (a) => a.quizQuestionId === q.id
      );
      const maxPoints = questionWeights[index] ?? 0;
      const studentAnswer = getQuestionOptionLabel(q, answer?.selectedOption);
      const correctAnswer = getQuestionOptionLabel(q, q.opsiBenar) ?? "-";
      const isCorrect = answer?.isCorrect ?? null;

      return {
        id: String(q.id),
        type: "multiple-choice" as const,
        question: q.pertanyaan,
        studentAnswer,
        correctAnswer,
        isCorrect,
        points: isCorrect ? maxPoints : 0,
        maxPoints,
        teacherNote: "",
      };
    }),
  };
}

export async function gradeQuizAttempt(
  attemptId: string,
  userId: string,
  payload: { action: "draft" | "publish" | "retake"; score?: number }
) {
  const teacher = await requireTeacherContext(userId);
  const bigId = toBigIntId(attemptId, "Attempt ID");

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: bigId,
      quiz: { moduleStudentClass: { teacherId: teacher.id } },
    },
  });

  if (!attempt) throw new AppError("Attempt kuis tidak ditemukan", 404);

  await prisma.quizAttempt.update({
    where: { id: bigId },
    data: {
      retakeRequested: payload.action === "retake",
      ...(payload.score !== undefined && { score: payload.score }),
    },
  });

  return getQuizAttemptDetail(attemptId, userId);
}
