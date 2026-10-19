import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { requireTeacherContext, requireTeacherOwnsOffering } from "./teacher-context.service.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";

export async function listTeacherModules(userId: string) {
  const teacher = await requireTeacherContext(userId);

  const offerings = await prisma.moduleStudentClass.findMany({
    where: { teacherId: teacher.id },
    include: {
      module: { include: { department: true } },
      studentClass: { include: { tingkat: true } },
      sections: true,
      lessons: { select: { id: true, status: true } },
      quizzes: {
        where: {
          sectionId: { not: null }
        },
        select: { id: true, isAktif: true }
      },
      tasks: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return offerings.map((mc) => {
    const lessonCount = mc.lessons.length;
    const quizCount = mc.quizzes.length;
    const taskCount = mc.tasks.length;
    const draftLessons = mc.lessons.filter((l) => l.status === "draft").length;
    const draftTasks = mc.tasks.filter((t) => t.status === "draft").length;

    return {
      id: String(mc.id),
      moduleId: String(mc.module.id),
      title: mc.module.judul,
      department: mc.module.department?.namaJurusan ?? mc.module.jurusan ?? "",
      gradeLevel: mc.studentClass?.namaKelas ?? "-",
      chapters: mc.sections.length,
      lessons: lessonCount,
      quizzes: quizCount,
      tasks: taskCount,
      draftItems: draftLessons + draftTasks,
      completionRate: 0,
      status: mc.module.isAktif ? "published" : "draft",
    };
  });
}

export async function getTeacherModuleDetail(
  offeringId: string,
  userId: string
) {
  const bigId = toBigIntId(offeringId, "Modul ID");
  const { teacher, offering: _offering } = await requireTeacherOwnsOffering(
    bigId,
    userId
  );

  const mc = await prisma.moduleStudentClass.findFirst({
    where: { id: bigId, teacherId: teacher.id },
    include: {
      module: { include: { department: true } },
      studentClass: { include: { tingkat: true, jurusan: true } },
      sections: { orderBy: { urutan: "asc" } },
      lessons: {
        orderBy: { posisi: "asc" },
        select: {
          id: true,
          createdAt: true,
          judul: true,
          tipeKonten: true,
          konten: true,
          urlKonten: true,
          posisi: true,
          status: true,
          tersediaPada: true,
          durasi: true,
          sectionId: true,
        },
      },
      quizzes: {
        where: {
          sectionId: { not: null }
        },
        orderBy: { posisi: "asc" },
        select: {
          id: true,
          createdAt: true,
          judul: true,
          posisi: true,
          isAktif: true,
          availableAt: true,
          deadline: true,
          skorLulus: true,
          durasiMenit: true,
          sectionId: true,
          _count: { select: { questions: true } },
        },
      },
      tasks: {
        orderBy: { posisi: "asc" },
        select: {
          id: true,
          createdAt: true,
          judul: true,
          deskripsi: true,
          attachmentPath: true,
          attachmentType: true,
          availableAt: true,
          deadline: true,
          posisi: true,
          status: true,
          submitMethod: true,
          isAktif: true,
          allowRevision: true,
          sectionId: true,
          lessonId: true,
          _count: { select: { submissions: true } },
        },
      },
    },
  });

  if (!mc) throw new AppError("Mata pelajaran tidak ditemukan", 404);

  const buildPublicLessonContentUrl = (value: string | null) =>
    value ? new URL(value, env.BETTER_AUTH_URL).toString() : "";

  return {
    id: String(mc.id),
    moduleId: String(mc.module.id),
    title: mc.module.judul,
    description: mc.module.deskripsi ?? "",
    department: mc.module.department?.namaJurusan ?? mc.module.jurusan ?? "",
    gradeLevel: mc.studentClass?.namaKelas ?? "-",
    isActive: mc.module.isAktif,
    sections: mc.sections.map((s) => ({
      id: String(s.id),
      title: s.judul,
      order: s.urutan,
    })),
    lessons: mc.lessons.map((l) => ({
      id: String(l.id),
      createdAt: l.createdAt?.toISOString() ?? null,
      title: l.judul,
      contentType: l.tipeKonten,
      body: l.konten,
      contentUrl: buildPublicLessonContentUrl(l.urlKonten),
      position: l.posisi,
      status: l.status,
      availableAt: l.tersediaPada?.toISOString() ?? null,
      durationMinutes: l.durasi,
      sectionId: l.sectionId ? String(l.sectionId) : null,
    })),
    quizzes: mc.quizzes.map((q) => ({
      id: String(q.id),
      createdAt: q.createdAt?.toISOString() ?? null,
      title: q.judul,
      position: q.posisi,
      isActive: q.isAktif,
      availableAt: q.availableAt?.toISOString() ?? null,
      deadline: q.deadline?.toISOString() ?? null,
      passScore: q.skorLulus,
      durationMinutes: q.durasiMenit,
      questionCount: q._count.questions,
      sectionId: q.sectionId ? String(q.sectionId) : null,
    })),
    tasks: mc.tasks.map((t) => ({
      id: String(t.id),
      createdAt: t.createdAt?.toISOString() ?? null,
      title: t.judul,
      description: t.deskripsi ?? "",
      availableAt: t.availableAt?.toISOString() ?? null,
      deadline: t.deadline.toISOString(),
      position: t.posisi,
      status: t.status,
      submitMethod: t.submitMethod,
      isActive: t.isAktif,
      allowRevision: t.allowRevision,
      submissionCount: t._count.submissions,
      lessonId: t.lessonId ? String(t.lessonId) : null,
      sectionId: t.sectionId ? String(t.sectionId) : null,
      attachment:
        t.attachmentPath && t.attachmentType
          ? {
              fileName: t.attachmentPath.split("/").pop() ?? "lampiran",
              mimeType: t.attachmentType,
              url: new URL(t.attachmentPath, env.BETTER_AUTH_URL).toString(),
            }
          : null,
    })),
  };
}
