import { prisma } from "../lib/prisma.js";
import { SubmissionStatus } from "@prisma/client";
import { requireTeacherContext } from "./teacher-context.service.js";

export async function getTeacherDashboard(userId: string) {
  const teacher = await requireTeacherContext(userId);

  // Semua ModuleStudentClass yang diampu dosen ini.
  const offeringIds = teacher.moduleClasses.map((mc) => mc.id);

  const [lessons, quizzes, tasks, submissions, quizAttempts] =
    await Promise.all([
      prisma.lesson.findMany({
        where: { moduleStudentClassId: { in: offeringIds } },
        select: { id: true, status: true },
      }),
      prisma.quiz.findMany({
        where: {
          modulesStudentClassId: { in: offeringIds },
          sectionId: { not: null }
        },
        select: { id: true, isAktif: true },
      }),
      prisma.task.findMany({
        where: { modulesStudentClassId: { in: offeringIds } },
        select: { id: true, status: true, isAktif: true },
      }),
      prisma.taskSubmission.findMany({
        where: {
          taskId: {
            in: await prisma.task
              .findMany({
                where: {
                  modulesStudentClassId: { in: offeringIds }
                },
                select: { id: true },
              })
              .then((t) => t.map((x) => x.id)),
          },
          status: SubmissionStatus.SUBMITTED,
        },
        select: { id: true },
      }),
      prisma.quizAttempt.findMany({
        where: {
          quizId: {
            in: await prisma.quiz
              .findMany({
                where: {
                  modulesStudentClassId: { in: offeringIds },
                  sectionId: { not: null }
                },
                select: { id: true },
              })
              .then((q) => q.map((x) => x.id)),
          },
          submittedAt: { not: null },
        },
        select: { id: true, retakeRequested: true },
      }),
    ]);

  const activeModules = teacher.moduleClasses.filter(
    (mc) => mc.module.isAktif
  ).length;

  const activeClasses = new Set(
    teacher.moduleClasses
      .filter((mc) => mc.studentClassId)
      .map((mc) => mc.studentClassId)
  ).size;

  const draftItems =
    lessons.filter((l) => l.status === "draft").length +
    tasks.filter((t) => t.status === "draft").length +
    quizzes.filter((q) => !q.isAktif).length;

  const needReview = submissions.length;
  const pendingRevision = quizAttempts.filter(
    (a) => a.retakeRequested
  ).length;

  const taskIds = tasks.map((task) => task.id);

  const [recentTaskSubmissions, integrityChecks] = await Promise.all([
    prisma.taskSubmission.findMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
      include: {
        user: true,
        task: {
          include: {
            moduleStudentClass: {
              include: { module: true, studentClass: true },
            },
          },
        },
        similarityCheck: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
    prisma.taskSubmissionSimilarityCheck.findMany({
      where: {
        submission: {
          taskId: {
            in: taskIds,
          },
        },
      },
      select: {
        id: true,
        similarityStatus: true,
        maxSimilarity: true,
        similarityLevel: true,
      },
    }),
  ]);

  const completedIntegrityChecks = integrityChecks.filter(
    (check) => check.similarityStatus === "completed"
  );
  const maxSimilarity =
    completedIntegrityChecks.length > 0
      ? Math.round(Math.max(...completedIntegrityChecks.map((check) => check.maxSimilarity)))
      : 0;

  // Modules summary for dashboard table
  const moduleSummaries = await Promise.all(
    teacher.moduleClasses.map(async (mc) => {
      const [lessonCount, quizCount, taskCount, submissionCountAll] =
        await Promise.all([
          prisma.lesson.count({ where: { moduleStudentClassId: mc.id } }),
          prisma.quiz.count({
            where: {
              modulesStudentClassId: mc.id,
              sectionId: { not: null }
            }
          }),
          prisma.task.count({ where: { modulesStudentClassId: mc.id } }),
          prisma.lessonUser.count({
            where: { lesson: { moduleStudentClassId: mc.id } },
          }),
        ]);

      const sectionCount = await prisma.section.count({
        where: { moduleStudentClassId: mc.id },
      });

      const totalItems = lessonCount + quizCount + taskCount;
      const completedItems = await prisma.lessonUser.count({
        where: {
          lesson: { moduleStudentClassId: mc.id },
          isCompleted: true,
        },
      });

      const completionRate =
        submissionCountAll > 0
          ? Math.round((completedItems / submissionCountAll) * 100)
          : 0;

      return {
        id: String(mc.id),
        title: mc.module.judul,
        department: mc.module.jurusan ?? "",
        gradeLevel: mc.studentClass?.namaKelas ?? "-",
        chapters: sectionCount,
        lessons: lessonCount,
        quizzes: quizCount,
        tasks: taskCount,
        completionRate,
        status: mc.module.isAktif ? "published" : "draft",
      };
    })
  );

  return {
    teacher: {
      id: String(teacher.id),
      name: teacher.nama,
      nip: teacher.nip,
      department: teacher.jurusan?.namaJurusan ?? "",
    },
    kpi: {
      activeModules,
      activeClasses,
      draftItems,
      needReview,
      pendingRevision,
    },
    modules: moduleSummaries,
    recentSubmissions: recentTaskSubmissions.map((sub) => ({
      id: String(sub.id),
      studentName: sub.user.name,
      className: sub.task.moduleStudentClass.studentClass?.namaKelas ?? "-",
      courseTitle: sub.task.moduleStudentClass.module.judul,
      assignmentTitle: sub.task.judul,
      submittedAt: sub.submittedAt?.toISOString() ?? null,
      status: sub.status.toLowerCase(),
      score: sub.score ?? null,
      similarityPercent: Math.round(sub.similarityCheck?.maxSimilarity ?? 0),
      similarityStatus: sub.similarityCheck?.similarityStatus ?? "not_requested",
    })),
    integrity: {
      checked: completedIntegrityChecks.length,
      pending: integrityChecks.filter((check) => check.similarityStatus !== "completed").length,
      highSimilarity: completedIntegrityChecks.filter((check) => check.maxSimilarity >= 70).length,
      maxSimilarity,
    },
  };
}
