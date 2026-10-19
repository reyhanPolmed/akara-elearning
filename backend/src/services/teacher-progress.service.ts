import { prisma } from "../lib/prisma.js";
import { requireTeacherContext } from "./teacher-context.service.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";

function calcRiskLevel(completionRate: number, latestQuizScore: number | null): "rendah" | "sedang" | "tinggi" {
  if (completionRate >= 70 && (latestQuizScore === null || latestQuizScore >= 70)) return "rendah";
  if (completionRate >= 40) return "sedang";
  return "tinggi";
}

export async function listStudentProgress(
  userId: string,
  filters?: {
    moduleStudentClassId?: string;
    riskLevel?: string;
  }
) {
  const teacher = await requireTeacherContext(userId);
  const offeringIds = teacher.moduleClasses.map((mc) => mc.id);

  const targetOfferingIds = filters?.moduleStudentClassId
    ? [toBigIntId(filters.moduleStudentClassId)]
    : offeringIds;

  // Semua siswa dari kelas yang terhubung ke modul guru
  const offerings = await prisma.moduleStudentClass.findMany({
    where: { id: { in: targetOfferingIds }, teacherId: teacher.id },
    include: {
      module: true,
      studentClass: {
        include: {
          students: {
            include: { user: true },
          },
        },
      },
      sections: true,
      lessons: {
        include: {
          lessonUsers: true,
        },
      },
      quizzes: {
        include: {
          attempts: {
            where: { submittedAt: { not: null } },
            orderBy: { submittedAt: "desc" },
          },
        },
      },
      tasks: {
        include: { submissions: true },
      },
    },
  });

  const progressRows: {
    id: string;
    studentName: string;
    className: string;
    courseTitle: string;
    activeChapter: string;
    completedItemsCount: string;
    latestQuizScore: number | null;
    taskStatus: string;
    riskLevel: "rendah" | "sedang" | "tinggi";
    lastActivityAt: string | null;
  }[] = [];

  for (const offering of offerings) {
    const students = offering.studentClass?.students ?? [];
    const totalItems =
      offering.lessons.length + offering.quizzes.length + offering.tasks.length;

    for (const student of students) {
      const completedLessons = offering.lessons.filter((l) =>
        l.lessonUsers.some(
          (lu) => lu.userId === student.userId && lu.isCompleted
        )
      ).length;

      const completedQuizzes = offering.quizzes.filter((q) =>
        q.attempts.some((a) => a.userId === student.userId)
      ).length;

      const completedTasks = offering.tasks.filter((t) =>
        t.submissions.some((s) => s.userId === student.userId)
      ).length;

      const completedItems = completedLessons + completedQuizzes + completedTasks;
      const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Latest quiz score
      const latestAttempt = offering.quizzes
        .flatMap((q) => q.attempts.filter((a) => a.userId === student.userId))
        .sort((a, b) => {
          const aTime = a.submittedAt?.getTime() ?? 0;
          const bTime = b.submittedAt?.getTime() ?? 0;
          return bTime - aTime;
        })[0];

      const latestQuizScore = latestAttempt?.score ?? null;

      // Task status
      const taskSub = offering.tasks
        .flatMap((t) => t.submissions.filter((s) => s.userId === student.userId))
        .sort((a, b) => {
          const aTime = a.submittedAt?.getTime() ?? 0;
          const bTime = b.submittedAt?.getTime() ?? 0;
          return bTime - aTime;
        })[0];

      const taskStatus = taskSub ? taskSub.status.toLowerCase() : "belum";

      // Active chapter (section yang sedang berjalan)
      const inProgressLesson = offering.lessons.find((l) =>
        !l.lessonUsers.some((lu) => lu.userId === student.userId && lu.isCompleted)
      );
      const activeSectionId = inProgressLesson?.sectionId;
      const activeSection = offering.sections.find((s) => s.id === activeSectionId);
      const activeChapter = activeSection ? activeSection.judul : "Belum mulai";

      // Last activity
      const lastLessonActivity = offering.lessons
        .flatMap((l) =>
          l.lessonUsers.filter((lu) => lu.userId === student.userId)
        )
        .sort((a, b) => {
          const aTime = (a.updatedAt as Date | null)?.getTime() ?? 0;
          const bTime = (b.updatedAt as Date | null)?.getTime() ?? 0;
          return bTime - aTime;
        })[0];

      const lastActivityAt =
        (lastLessonActivity as { updatedAt?: Date | null })?.updatedAt?.toISOString() ?? null;

      const riskLevel = calcRiskLevel(completionRate, latestQuizScore);

      if (filters?.riskLevel && filters.riskLevel !== riskLevel) continue;

      progressRows.push({
        id: `${String(offering.id)}-${String(student.id)}`,
        studentName: student.user.name,
        className: offering.studentClass?.namaKelas ?? "-",
        courseTitle: offering.module.judul,
        activeChapter,
        completedItemsCount: `${completedItems}/${totalItems}`,
        latestQuizScore,
        taskStatus,
        riskLevel,
        lastActivityAt,
      });
    }
  }

  return progressRows;
}

export async function getStudentProgressDetail(
  offeringId: string,
  studentId: string,
  userId: string
) {
  const teacher = await requireTeacherContext(userId);
  const bigOfferingId = toBigIntId(offeringId, "Offering ID");
  const bigStudentId = toBigIntId(studentId, "Student ID");

  const offering = await prisma.moduleStudentClass.findFirst({
    where: { id: bigOfferingId, teacherId: teacher.id },
    include: {
      module: true,
      studentClass: true,
      sections: { orderBy: { urutan: "asc" } },
      lessons: {
        orderBy: { posisi: "asc" },
        include: {
          lessonUsers: { where: { user: { students: { some: { id: bigStudentId } } } } },
        },
      },
      quizzes: {
        orderBy: { posisi: "asc" },
        include: {
          attempts: {
            where: {
              user: { students: { some: { id: bigStudentId } } },
              submittedAt: { not: null },
            },
            orderBy: { submittedAt: "desc" },
            take: 5,
          },
        },
      },
      tasks: {
        orderBy: { posisi: "asc" },
        include: {
          submissions: {
            where: { user: { students: { some: { id: bigStudentId } } } },
          },
          rubrics: true,
        },
      },
    },
  });

  if (!offering) throw new AppError("Modul tidak ditemukan atau tidak bisa diakses", 404);

  const student = await prisma.student.findFirst({
    where: { id: bigStudentId },
    include: { user: true, kelas: true },
  });

  if (!student) throw new AppError("Siswa tidak ditemukan", 404);

  const sectionOrder = new Map(
    offering.sections.map((section) => [String(section.id), section.urutan])
  );
  const sectionTitle = new Map(
    offering.sections.map((section) => [String(section.id), section.judul])
  );
  const timeline = [
    ...offering.lessons.map((lesson) => {
      const progress = lesson.lessonUsers[0];
      const completed = Boolean(progress?.isCompleted);
      const chapter = sectionTitle.get(String(lesson.sectionId ?? "")) ?? "Tanpa Bab";

      return {
        id: `lesson-${lesson.id}`,
        item: `Materi: ${lesson.judul}`,
        status: completed ? "approved" : "pending",
        note: completed
          ? `${chapter} selesai dipelajari siswa.`
          : `${chapter} belum diselesaikan siswa.`,
        timestamp: progress?.updatedAt?.toISOString() ?? null,
        sectionRank: sectionOrder.get(String(lesson.sectionId ?? "")) ?? Number.MAX_SAFE_INTEGER,
        itemRank: lesson.posisi,
      };
    }),
    ...offering.quizzes.map((quiz) => {
      const latestAttempt = quiz.attempts[0];
      const chapter = sectionTitle.get(String(quiz.sectionId ?? "")) ?? "Tanpa Bab";
      const status = latestAttempt
        ? latestAttempt.retakeRequested
          ? "retake"
          : "graded"
        : "pending";
      const note = latestAttempt
        ? `${chapter} dikerjakan dengan skor ${latestAttempt.score}. ${latestAttempt.isPassed ? "Lulus" : "Belum lulus"}.`
        : `${chapter} belum dikerjakan siswa.`;

      return {
        id: `quiz-${quiz.id}`,
        item: `Kuis: ${quiz.judul}`,
        status,
        note,
        timestamp: latestAttempt?.submittedAt?.toISOString() ?? null,
        sectionRank: sectionOrder.get(String(quiz.sectionId ?? "")) ?? Number.MAX_SAFE_INTEGER,
        itemRank: quiz.posisi,
      };
    }),
    ...offering.tasks.map((task) => {
      const submission = task.submissions[0];
      const chapter = sectionTitle.get(String(task.sectionId ?? "")) ?? "Tanpa Bab";

      let status = "pending";
      if (submission) {
        status =
          submission.status.toLowerCase() === "revised"
            ? "revision"
            : submission.status.toLowerCase();
      }

      const note = submission
        ? submission.score !== null
          ? `${chapter} dikumpulkan siswa dengan skor ${submission.score}.`
          : `${chapter} sudah dikumpulkan dan menunggu tindak lanjut guru.`
        : `${chapter} belum dikumpulkan siswa.`;

      return {
        id: `task-${task.id}`,
        item: `Tugas: ${task.judul}`,
        status,
        note,
        timestamp: submission?.updatedAt?.toISOString() ?? submission?.submittedAt?.toISOString() ?? null,
        sectionRank: sectionOrder.get(String(task.sectionId ?? "")) ?? Number.MAX_SAFE_INTEGER,
        itemRank: task.posisi,
      };
    }),
  ]
    .sort((left, right) => {
      if (left.sectionRank !== right.sectionRank) {
        return left.sectionRank - right.sectionRank;
      }
      return left.itemRank - right.itemRank;
    })
    .map(({ sectionRank: _sectionRank, itemRank: _itemRank, ...entry }) => entry);

  const needsFollowUp = timeline.some((entry) =>
    ["retake", "revision", "submitted"].includes(entry.status)
  );

  return {
    student: {
      id: String(student.id),
      name: student.user.name,
      className: student.kelas?.namaKelas ?? "-",
    },
    module: {
      id: String(offering.id),
      title: offering.module.judul,
    },
    timeline,
    internalNote: needsFollowUp
      ? "Perhatikan item yang masih berstatus submitted, revision, atau retake untuk tindak lanjut berikutnya."
      : "Perkembangan siswa stabil pada modul ini.",
  };
}
