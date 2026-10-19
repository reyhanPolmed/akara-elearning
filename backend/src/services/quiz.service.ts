import { Prisma, QuizAttemptsStatus } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import {
  buildSequentialSidebar,
  requireStudentContext,
  toBigIntId
} from "./lms-context.service.js";
import { AppError } from "../utils/app-error.js";
import { shuffle } from "../utils/shuffle.js";

const MAX_QUIZ_ATTEMPTS = 2;

type QuizDbClient = typeof prisma | Prisma.TransactionClient;
type StudentContext = Awaited<ReturnType<typeof requireStudentContext>>;
type QuizGraph = Awaited<ReturnType<typeof getQuizGraphWithClient>>;

function parseQuestionOrder(value: string | null, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeOption(value: string | undefined) {
  const option = value?.trim().toUpperCase() ?? "";
  return /^[A-D]$/.test(option) ? option : "";
}

async function lockQuizAttempt(db: QuizDbClient, quizId: bigint, userId: bigint) {
  const lockKey = `quiz-attempt:${quizId.toString()}:${userId.toString()}`;
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;
}

function isRetryableTransactionError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  const message = "message" in error ? (error as { message?: unknown }).message : undefined;

  return (
    code === "P2034" ||
    (typeof message === "string" &&
      (message.includes("write conflict") ||
        message.includes("deadlock") ||
        message.includes("Please retry your transaction")))
  );
}

async function withQuizAttemptLock<T>(
  quizId: bigint,
  userId: bigint,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
) {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await lockQuizAttempt(tx, quizId, userId);
          return callback(tx);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );
    } catch (error) {
      lastError = error;

      if (!isRetryableTransactionError(error) || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 75));
    }
  }

  throw lastError;
}

async function getQuizGraphWithClient(
  db: QuizDbClient,
  quizId: bigint,
  student: StudentContext
) {
  const quiz = await db.quiz.findFirst({
    where: {
      id: quizId,
      isAktif: true,
      sectionId: {
        not: null
      },
      moduleStudentClass: {
        studentClassId: student.kelas.id,
        module: {
          isAktif: true
        }
      }
    },
    include: {
      questions: {
        orderBy: {
          id: "asc"
        }
      },
      attempts: {
        where: {
          userId: student.userId
        },
        include: {
          answers: {
            orderBy: {
              id: "asc"
            }
          }
        },
        orderBy: {
          startedAt: "desc"
        },
        take: 5
      },
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

  if (!quiz) {
    throw new AppError("Quiz tidak ditemukan", 404);
  }

  return quiz;
}

async function getQuizGraph(quizId: string, userId: string) {
  const student = await requireStudentContext(userId);
  const bigQuizId = toBigIntId(quizId, "Quiz ID");
  return getQuizGraphWithClient(prisma, bigQuizId, student);
}

function getDurationSeconds(quiz: QuizGraph) {
  return Math.max(0, quiz.durasiMenit ?? 0) * 60;
}

function getElapsedSeconds(
  attempt: QuizGraph["attempts"][number],
  now: Date
) {
  const endAt = attempt.submittedAt ?? now;
  return Math.max(0, Math.floor((endAt.getTime() - attempt.startedAt.getTime()) / 1000));
}

function getRemainingSeconds(
  quiz: QuizGraph,
  attempt: QuizGraph["attempts"][number],
  now: Date
) {
  const durationSeconds = getDurationSeconds(quiz);
  if (durationSeconds <= 0) {
    return 0;
  }

  return Math.max(0, durationSeconds - getElapsedSeconds(attempt, now));
}

function isAttemptExpired(
  quiz: QuizGraph,
  attempt: QuizGraph["attempts"][number],
  now: Date
) {
  return getDurationSeconds(quiz) > 0 && getRemainingSeconds(quiz, attempt, now) <= 0;
}

function mapAttemptAnswers(attempt: QuizGraph["attempts"][number]) {
  return Object.fromEntries(
    attempt.answers
      .map((answer) => [String(answer.quizQuestionId), answer.selectedOption] as const)
      .filter((entry) => Boolean(entry[1]))
  );
}

function buildAttemptNumberMap(attempts: QuizGraph["attempts"]) {
  return new Map(
    [...attempts]
      .sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
      .map((attempt, index) => [attempt.id.toString(), index + 1])
  );
}

function getActiveAttempt(attempts: QuizGraph["attempts"]) {
  return attempts.find((attempt) => attempt.submittedAt === null) ?? null;
}

function getLatestSubmittedAttempt(attempts: QuizGraph["attempts"]) {
  return attempts.find((attempt) => attempt.submittedAt !== null) ?? null;
}

function mapSubmissionTiming(status: QuizAttemptsStatus | null | undefined) {
  if (!status) {
    return null;
  }

  return status === QuizAttemptsStatus.LATE ? "late" : "on_time";
}

function mapQuizAttemptView(
  quiz: QuizGraph,
  attempt: QuizGraph["attempts"][number]
) {
  const now = new Date();
  const durationSeconds = getDurationSeconds(quiz);
  const elapsedSeconds = getElapsedSeconds(attempt, now);
  const remainingSeconds = getRemainingSeconds(quiz, attempt, now);
  const attemptNumberMap = buildAttemptNumberMap(quiz.attempts);

  return {
    id: String(attempt.id),
    quizId: String(quiz.id),
    attemptNumber: attemptNumberMap.get(attempt.id.toString()) ?? quiz.attempts.length,
    status: attempt.submittedAt ? "submitted" : "in_progress",
    questionOrder: parseQuestionOrder(
      attempt.questionOrder,
      quiz.questions.map((question) => String(question.id))
    ),
    answers: mapAttemptAnswers(attempt),
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    durationSeconds,
    elapsedSeconds,
    remainingSeconds,
    isExpired: attempt.submittedAt === null && durationSeconds > 0 && remainingSeconds <= 0,
    submissionTiming: attempt.submittedAt ? mapSubmissionTiming(attempt.status) : null,
    score: attempt.submittedAt ? attempt.score : undefined,
    isPassed: attempt.submittedAt ? attempt.isPassed : undefined,
    serverNow: now.toISOString()
  };
}

function buildQuizDetailView(quiz: QuizGraph) {
  const activeAttempt = getActiveAttempt(quiz.attempts);
  const latestSubmittedAttempt = getLatestSubmittedAttempt(quiz.attempts);
  const fallbackOrder = quiz.questions.map((question) => String(question.id));
  const questionOrder = parseQuestionOrder(
    activeAttempt?.questionOrder ?? latestSubmittedAttempt?.questionOrder ?? null,
    fallbackOrder
  );
  const { sidebar } = buildSequentialSidebar({
    sections: quiz.moduleStudentClass.sections.map((section) => ({
      id: section.id,
      title: section.judul,
      description: null,
      order: section.urutan
    })),
    lessons: quiz.moduleStudentClass.lessons.map((item) => ({
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
    quizzes: quiz.moduleStudentClass.quizzes.map((item) => ({
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
    tasks: quiz.moduleStudentClass.tasks.map((item) => ({
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

  return {
    id: String(quiz.id),
    courseId: String(quiz.moduleStudentClass.id),
    title: quiz.judul,
    intro: "",
    passScore: quiz.skorLulus,
    durationMinutes: quiz.durasiMenit,
    serverNow: new Date().toISOString(),
    maxAttempts: MAX_QUIZ_ATTEMPTS,
    attemptsUsed: quiz.attempts.length,
    attemptsRemaining: Math.max(0, MAX_QUIZ_ATTEMPTS - quiz.attempts.length),
    questionOrder,
    questions: quiz.questions.map((question) => ({
      id: String(question.id),
      prompt: question.pertanyaan,
      options: [
        { key: "A", label: question.opsiA },
        { key: "B", label: question.opsiB },
        { key: "C", label: question.opsiC },
        { key: "D", label: question.opsiD }
      ],
      correctOption: ""
    })),
    penaltyNote: "Fullscreen violation akan menurunkan skor sesuai aturan backend.",
    sidebar,
    lastScore: latestSubmittedAttempt?.score ?? undefined,
    activeAttempt: activeAttempt ? mapQuizAttemptView(quiz, activeAttempt) : null,
    latestSubmittedAttempt: latestSubmittedAttempt ? mapQuizAttemptView(quiz, latestSubmittedAttempt) : null
  };
}

function buildEvaluatedAnswers(
  quiz: QuizGraph,
  userId: bigint,
  attemptId: bigint,
  answers: Record<string, string>
) {
  return quiz.questions.map((question) => {
    const selectedOption = normalizeOption(answers[String(question.id)]);
    return {
      quizAttemptId: attemptId,
      quizQuestionId: question.id,
      userId,
      selectedOption,
      isCorrect: selectedOption !== "" && selectedOption === question.opsiBenar.toUpperCase()
    };
  });
}

async function persistAttemptAnswers(
  db: Prisma.TransactionClient,
  evaluatedAnswers: ReturnType<typeof buildEvaluatedAnswers>
) {
  if (evaluatedAnswers.length === 0) {
    return;
  }

  const firstAnswer = evaluatedAnswers[0];
  if (!firstAnswer) {
    return;
  }

  const quizAttemptId = firstAnswer.quizAttemptId;
  const persistedRows = evaluatedAnswers.filter((answer) => answer.selectedOption !== "");

  await db.quizUserAnswer.deleteMany({
    where: {
      quizAttemptId
    }
  });

  if (persistedRows.length > 0) {
    await db.quizUserAnswer.createMany({
      data: persistedRows
    });
  }
}

function hydrateAttemptWithAnswers(
  attempt: QuizGraph["attempts"][number],
  evaluatedAnswers: ReturnType<typeof buildEvaluatedAnswers>
) {
  return {
    ...attempt,
    answers: evaluatedAnswers
      .filter((answer) => answer.selectedOption !== "")
      .map((answer, index) => ({
        id: -(index + 1) as unknown as bigint,
        quizAttemptId: answer.quizAttemptId,
        quizQuestionId: answer.quizQuestionId,
        userId: answer.userId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        createdAt: null,
        updatedAt: null
      }))
  };
}

export async function getStudentQuizDetail(quizId: string, userId: string) {
  const quiz = await getQuizGraph(quizId, userId);
  return buildQuizDetailView(quiz);
}

export async function startQuizAttempt(quizId: string, userId: string) {
  const student = await requireStudentContext(userId);
  const bigQuizId = toBigIntId(quizId, "Quiz ID");

  return withQuizAttemptLock(bigQuizId, student.userId, async (tx) => {
    const quiz = await getQuizGraphWithClient(tx, bigQuizId, student);
    const activeAttempt = getActiveAttempt(quiz.attempts);

    if (activeAttempt) {
      return mapQuizAttemptView(quiz, activeAttempt);
    }

    if (quiz.attempts.length >= MAX_QUIZ_ATTEMPTS) {
      throw new AppError("Batas maksimal attempt quiz adalah 2 kali", 422);
    }

    const questionOrder = shuffle(quiz.questions.map((question) => String(question.id)));
    const attempt = await tx.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: student.userId,
        questionOrder: JSON.stringify(questionOrder),
        status: QuizAttemptsStatus.ON_TIME
      }
    });

    const createdAttempt = {
      ...attempt,
      answers: []
    };

    return mapQuizAttemptView(
      {
        ...quiz,
        attempts: [createdAttempt, ...quiz.attempts]
      },
      createdAttempt
    );
  });
}

export async function saveQuizAttemptAnswers(
  quizId: string,
  userId: string,
  payload: {
    attemptId: string;
    answers: Record<string, string>;
  }
) {
  const student = await requireStudentContext(userId);
  const bigQuizId = toBigIntId(quizId, "Quiz ID");
  const bigAttemptId = toBigIntId(payload.attemptId, "Attempt ID");

  return withQuizAttemptLock(bigQuizId, student.userId, async (tx) => {
    const quiz = await getQuizGraphWithClient(tx, bigQuizId, student);
    const attempt = quiz.attempts.find((item) => item.id === bigAttemptId);

    if (!attempt) {
      throw new AppError("Attempt quiz tidak ditemukan", 404);
    }

    if (attempt.submittedAt) {
      return mapQuizAttemptView(quiz, attempt);
    }

    if (isAttemptExpired(quiz, attempt, new Date())) {
      throw new AppError("Waktu quiz sudah habis. Submit attempt untuk menyelesaikannya.", 422);
    }

    const evaluatedAnswers = buildEvaluatedAnswers(quiz, student.userId, attempt.id, payload.answers);
    await persistAttemptAnswers(tx, evaluatedAnswers);

    const updatedAttempt = hydrateAttemptWithAnswers(attempt, evaluatedAnswers);

    return mapQuizAttemptView(
      {
        ...quiz,
        attempts: quiz.attempts.map((item) => (item.id === attempt.id ? updatedAttempt : item))
      },
      updatedAttempt
    );
  });
}

export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  payload: {
    attemptId: string;
    answers: Record<string, string>;
    fullscreenViolation: boolean;
  }
) {
  const student = await requireStudentContext(userId);
  const bigQuizId = toBigIntId(quizId, "Quiz ID");
  const bigAttemptId = toBigIntId(payload.attemptId, "Attempt ID");

  return withQuizAttemptLock(bigQuizId, student.userId, async (tx) => {
    const quiz = await getQuizGraphWithClient(tx, bigQuizId, student);
    const attempt = quiz.attempts.find((item) => item.id === bigAttemptId);

    if (!attempt) {
      throw new AppError("Attempt quiz tidak ditemukan", 404);
    }

    if (attempt.submittedAt) {
      return mapQuizAttemptView(quiz, attempt);
    }

    const submittedAt = new Date();
    const evaluatedAnswers = buildEvaluatedAnswers(quiz, student.userId, attempt.id, payload.answers);
    const correctAnswers = evaluatedAnswers.filter((answer) => answer.isCorrect).length;
    const baseScore = Math.round((correctAnswers / Math.max(quiz.questions.length, 1)) * 100);
    const score = payload.fullscreenViolation ? Math.max(0, baseScore - 10) : baseScore;
    const isPassed = score >= quiz.skorLulus;
    const elapsedSeconds = Math.max(
      0,
      Math.floor((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
    );
    const timeLimitExceeded =
      getDurationSeconds(quiz) > 0 && elapsedSeconds > getDurationSeconds(quiz);
    const isLateByDeadline = Boolean(quiz.deadline && submittedAt > quiz.deadline);
    const status = isLateByDeadline || timeLimitExceeded
      ? QuizAttemptsStatus.LATE
      : QuizAttemptsStatus.ON_TIME;

    await persistAttemptAnswers(tx, evaluatedAnswers);
    await tx.quizAttempt.update({
      where: {
        id: attempt.id
      },
      data: {
        score,
        isPassed,
        submittedAt,
        durationSeconds: elapsedSeconds,
        status
      }
    });
    await tx.quizUser.deleteMany({
      where: {
        quizId: quiz.id,
        userId: student.userId
      }
    });
    await tx.quizUser.create({
      data: {
        quizId: quiz.id,
        userId: student.userId,
        score,
        isPassed
      }
    });

    const submittedAttempt = hydrateAttemptWithAnswers(
      {
        ...attempt,
        score,
        isPassed,
        submittedAt,
        durationSeconds: elapsedSeconds,
        status
      },
      evaluatedAnswers
    );

    return mapQuizAttemptView(
      {
        ...quiz,
        attempts: quiz.attempts.map((item) => (item.id === attempt.id ? submittedAttempt : item))
      },
      submittedAttempt
    );
  });
}

export async function getQuizResult(quizId: string, userId: string) {
  const quiz = await getQuizGraph(quizId, userId);
  const attempt = getLatestSubmittedAttempt(quiz.attempts);

  if (!attempt) {
    throw new AppError("Belum ada hasil quiz", 404);
  }

  return {
    attemptId: String(attempt.id),
    quizId: String(quiz.id),
    score: attempt.score ?? 0,
    isPassed: attempt.isPassed ?? false,
    submittedAt: attempt.submittedAt
  };
}

