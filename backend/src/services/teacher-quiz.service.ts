import { prisma } from "../lib/prisma.js";
import { requireTeacherContext, requireTeacherOwnsOffering } from "./teacher-context.service.js";
import { getNextMixedItemPosition } from "./item-position.service.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";

export type QuizQuestionPayload = {
  pertanyaan: string;
  questionImage?: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  opsiBenar: "A" | "B" | "C" | "D";
};

export type CreateQuizPayload = {
  moduleStudentClassId: string;
  sectionId?: string;
  lessonId?: string;
  judul: string;
  posisi?: number;
  skorLulus?: number;
  durasiMenit?: number;
  availableAt?: string;
  deadline?: string;
  isAktif?: boolean;
  questions: QuizQuestionPayload[];
};

export type CreateQuizBankPayload = {
  moduleId: string;
  judul: string;
  skorLulus?: number;
  durasiMenit?: number;
  isAktif?: boolean;
  questions: QuizQuestionPayload[];
};

export type UpdateQuizPayload = Partial<Omit<CreateQuizPayload, "moduleStudentClassId">>;

type ListTeacherQuizFilters = {
  offeringId?: string;
  scope?: "assigned" | "all";
};

async function assertTeacherOwnsQuiz(quizId: bigint, userId: string) {
  const teacher = await requireTeacherContext(userId);
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      moduleStudentClass: { teacherId: teacher.id },
    },
    include: { questions: { orderBy: { id: "asc" } } },
  });
  if (!quiz) throw new AppError("Kuis tidak ditemukan atau tidak bisa diakses", 404);
  return { teacher, quiz };
}

async function resolveCanonicalOfferingForModule(moduleId: string, userId: string) {
  const teacher = await requireTeacherContext(userId);
  const moduleBigId = toBigIntId(moduleId, "Module ID");
  const offering = await prisma.moduleStudentClass.findFirst({
    where: {
      teacherId: teacher.id,
      moduleId: moduleBigId
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!offering) {
    throw new AppError("Guru belum terhubung ke mata pelajaran ini", 404);
  }

  return { teacher, offering };
}

function normalizeQuizQuestions(questions: QuizQuestionPayload[]) {
  return questions.map((q) => ({
    pertanyaan: q.pertanyaan,
    questionImage: q.questionImage ?? null,
    opsiA: q.opsiA,
    opsiB: q.opsiB,
    opsiC: q.opsiC,
    opsiD: q.opsiD,
    opsiBenar: q.opsiBenar,
    jawabanBenar: null
  }));
}

export async function createQuiz(userId: string, payload: CreateQuizPayload) {
  const offeringId = toBigIntId(payload.moduleStudentClassId, "ModuleStudentClass ID");
  await requireTeacherOwnsOffering(offeringId, userId);

  let posisi = payload.posisi;
  if (!posisi) {
    posisi = await getNextMixedItemPosition(prisma, {
      offeringId,
      sectionId: payload.sectionId ? toBigIntId(payload.sectionId) : null,
    });
  }

  const quiz = await prisma.quiz.create({
    data: {
      modulesStudentClassId: offeringId,
      sectionId: payload.sectionId ? toBigIntId(payload.sectionId) : null,
      lessonId: payload.lessonId ? toBigIntId(payload.lessonId) : null,
      judul: payload.judul,
      posisi,
      skorLulus: payload.skorLulus ?? 70,
      durasiMenit: payload.durasiMenit ?? null,
      availableAt: payload.availableAt ? new Date(payload.availableAt) : null,
      deadline: payload.deadline ? new Date(payload.deadline) : null,
      isAktif: payload.isAktif ?? false,
      questions: {
        create: normalizeQuizQuestions(payload.questions),
      }
    },
    include: { questions: true },
  });

  return formatQuiz(quiz, quiz.questions);
}

export async function createQuizBank(userId: string, payload: CreateQuizBankPayload) {
  const { offering } = await resolveCanonicalOfferingForModule(payload.moduleId, userId);

  const maxPos = await prisma.quiz.aggregate({
    where: {
      modulesStudentClassId: offering.id,
      sectionId: null,
      lessonId: null
    },
    _max: { posisi: true }
  });

  const quiz = await prisma.quiz.create({
    data: {
      modulesStudentClassId: offering.id,
      sectionId: null,
      lessonId: null,
      judul: payload.judul,
      posisi: (maxPos._max.posisi ?? 0) + 1,
      skorLulus: payload.skorLulus ?? 70,
      durasiMenit: payload.durasiMenit ?? null,
      availableAt: null,
      deadline: null,
      isAktif: payload.isAktif ?? false,
      questions: {
        create: normalizeQuizQuestions(payload.questions)
      }
    },
    include: {
      questions: true,
      moduleStudentClass: {
        include: { module: true }
      }
    }
  });

  return {
    ...formatQuiz(quiz, quiz.questions),
    moduleName: quiz.moduleStudentClass.module.judul
  };
}

export async function updateQuiz(
  quizId: string,
  userId: string,
  payload: UpdateQuizPayload
) {
  const bigId = toBigIntId(quizId, "Quiz ID");
  const { quiz: currentQuiz } = await assertTeacherOwnsQuiz(bigId, userId);
  const nextSectionId =
    payload.sectionId !== undefined
      ? payload.sectionId
        ? toBigIntId(payload.sectionId)
        : null
      : currentQuiz.sectionId;
  const shouldReposition =
    payload.posisi === undefined &&
    payload.sectionId !== undefined &&
    nextSectionId !== currentQuiz.sectionId;
  const nextPosisi = shouldReposition
    ? await getNextMixedItemPosition(prisma, {
        offeringId: currentQuiz.modulesStudentClassId,
        sectionId: nextSectionId,
      })
    : payload.posisi;

  const quiz = await prisma.$transaction(async (tx) => {
    const updated = await tx.quiz.update({
      where: { id: bigId },
      data: {
        ...(payload.judul !== undefined && { judul: payload.judul }),
        ...(nextPosisi !== undefined && { posisi: nextPosisi }),
        ...(payload.skorLulus !== undefined && { skorLulus: payload.skorLulus }),
        ...(payload.durasiMenit !== undefined && { durasiMenit: payload.durasiMenit }),
        ...(payload.availableAt !== undefined && {
          availableAt: payload.availableAt ? new Date(payload.availableAt) : null,
        }),
        ...(payload.deadline !== undefined && {
          deadline: payload.deadline ? new Date(payload.deadline) : null,
        }),
        ...(payload.isAktif !== undefined && { isAktif: payload.isAktif }),
        ...(payload.sectionId !== undefined && {
          sectionId: payload.sectionId ? toBigIntId(payload.sectionId) : null,
        }),
      },
    });

    // Jika ada update soal — hapus semua lalu buat ulang
    if (payload.questions !== undefined) {
      await tx.quizQuestion.deleteMany({ where: { quizId: bigId } });
      await tx.quizQuestion.createMany({
        data: normalizeQuizQuestions(payload.questions).map((q) => ({
          ...q,
          quizId: bigId,
        })),
      });
    }

    const questions = await tx.quizQuestion.findMany({
      where: { quizId: bigId },
      orderBy: { id: "asc" },
    });

    return { updated, questions };
  });

  return formatQuiz(quiz.updated, quiz.questions);
}

export async function updateQuizStatus(quizId: string, userId: string, isAktif: boolean) {
  const bigId = toBigIntId(quizId, "Quiz ID");
  await assertTeacherOwnsQuiz(bigId, userId);

  const updated = await prisma.quiz.update({
    where: { id: bigId },
    data: { isAktif },
    include: { questions: true },
  });

  return formatQuiz(updated, updated.questions);
}

export async function deleteQuiz(quizId: string, userId: string) {
  const bigId = toBigIntId(quizId, "Quiz ID");
  await assertTeacherOwnsQuiz(bigId, userId);
  await prisma.quiz.delete({ where: { id: bigId } });
  return { success: true };
}

export async function getQuizById(quizId: string, userId: string) {
  const bigId = toBigIntId(quizId, "Quiz ID");
  const { quiz } = await assertTeacherOwnsQuiz(bigId, userId);
  return formatQuiz(quiz, quiz.questions);
}

export async function listTeacherQuizzes(
  userId: string,
  filters?: ListTeacherQuizFilters
) {
  const teacher = await requireTeacherContext(userId);
  const offeringBigId = filters?.offeringId ? toBigIntId(filters.offeringId) : undefined;
  const scope = filters?.scope ?? "assigned";

  const quizzes = await prisma.quiz.findMany({
    where: {
      moduleStudentClass: { teacherId: teacher.id },
      ...(offeringBigId && { modulesStudentClassId: offeringBigId }),
      ...(scope === "assigned" ? { sectionId: { not: null } } : {}),
    },
    include: {
      questions: true,
      moduleStudentClass: { include: { module: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return quizzes.map((q) => ({
    ...formatQuiz(q, q.questions),
    moduleName: q.moduleStudentClass.module.judul,
  }));
}

export async function listTeacherQuizBanks(userId: string, moduleId?: string) {
  const teacher = await requireTeacherContext(userId);
  const moduleBigId = moduleId ? toBigIntId(moduleId, "Module ID") : undefined;

  const quizzes = await prisma.quiz.findMany({
    where: {
      sectionId: null,
      lessonId: null,
      moduleStudentClass: {
        teacherId: teacher.id,
        ...(moduleBigId ? { moduleId: moduleBigId } : {})
      }
    },
    include: {
      questions: true,
      moduleStudentClass: { include: { module: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return quizzes.map((q) => ({
    ...formatQuiz(q, q.questions),
    moduleName: q.moduleStudentClass.module.judul,
  }));
}

export async function instantiateQuizFromBank(
  userId: string,
  payload: {
    sourceQuizId: string;
    moduleStudentClassId: string;
    sectionId?: string;
    availableAt?: string;
    deadline?: string;
    isAktif?: boolean;
  }
) {
  const sourceQuizId = toBigIntId(payload.sourceQuizId, "Source Quiz ID");
  const targetOfferingId = toBigIntId(payload.moduleStudentClassId, "ModuleStudentClass ID");
  const { quiz: sourceQuiz } = await assertTeacherOwnsQuiz(sourceQuizId, userId);
  await requireTeacherOwnsOffering(targetOfferingId, userId);

  if (sourceQuiz.sectionId !== null || sourceQuiz.lessonId !== null) {
    throw new AppError("Kuis sumber bukan bank kuis mandiri", 422);
  }

  const sourceQuestions = await prisma.quizQuestion.findMany({
    where: { quizId: sourceQuizId },
    orderBy: { id: "asc" }
  });

  const nextPosisi = await getNextMixedItemPosition(prisma, {
    offeringId: targetOfferingId,
    sectionId: payload.sectionId ? toBigIntId(payload.sectionId, "Section ID") : null,
  });

  const created = await prisma.quiz.create({
    data: {
      modulesStudentClassId: targetOfferingId,
      sectionId: payload.sectionId ? toBigIntId(payload.sectionId, "Section ID") : null,
      lessonId: null,
      judul: sourceQuiz.judul,
      posisi: nextPosisi,
      skorLulus: sourceQuiz.skorLulus,
      durasiMenit: sourceQuiz.durasiMenit,
      availableAt: payload.availableAt ? new Date(payload.availableAt) : null,
      deadline: payload.deadline ? new Date(payload.deadline) : null,
      isAktif: payload.isAktif ?? true,
      questions: {
        create: sourceQuestions.map((q) => ({
          pertanyaan: q.pertanyaan,
          questionImage: q.questionImage,
          opsiA: q.opsiA,
          opsiB: q.opsiB,
          opsiC: q.opsiC,
          opsiD: q.opsiD,
          opsiBenar: q.opsiBenar as "A" | "B" | "C" | "D",
          jawabanBenar: q.jawabanBenar
        }))
      }
    },
    include: {
      questions: true,
      moduleStudentClass: { include: { module: true } }
    }
  });

  return {
    ...formatQuiz(created, created.questions),
    moduleName: created.moduleStudentClass.module.judul
  };
}

function formatQuiz(
  quiz: {
    id: bigint;
    judul: string;
    posisi: number;
    skorLulus: number;
    durasiMenit: number | null;
    isAktif: boolean;
    availableAt: Date | null;
    deadline: Date | null;
    sectionId: bigint | null;
    modulesStudentClassId: bigint;
    moduleStudentClass?: {
      moduleId: bigint;
    };
  },
  questions: {
    id: bigint;
    pertanyaan: string;
    questionImage: string | null;
    opsiA: string;
    opsiB: string;
    opsiC: string;
    opsiD: string;
    opsiBenar: string;
  }[]
) {
  return {
    id: String(quiz.id),
    title: quiz.judul,
    position: quiz.posisi,
    passScore: quiz.skorLulus,
    durationMinutes: quiz.durasiMenit,
    isActive: quiz.isAktif,
    availableAt: quiz.availableAt?.toISOString() ?? null,
    deadline: quiz.deadline?.toISOString() ?? null,
    sectionId: quiz.sectionId ? String(quiz.sectionId) : null,
    moduleStudentClassId: String(quiz.modulesStudentClassId),
    moduleId: quiz.moduleStudentClass ? String(quiz.moduleStudentClass.moduleId) : undefined,
    questionCount: questions.length,
    questions: questions.map((q) => ({
      id: String(q.id),
      pertanyaan: q.pertanyaan,
      questionImage: q.questionImage,
      opsiA: q.opsiA,
      opsiB: q.opsiB,
      opsiC: q.opsiC,
      opsiD: q.opsiD,
      opsiBenar: q.opsiBenar,
    })),
  };
}
