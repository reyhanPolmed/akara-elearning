import { prisma } from "../lib/prisma.js";
import {
  buildSequentialSidebar,
  computeCompletionPercent,
  getNextItemTitle,
  requireStudentContext,
  toBigIntId
} from "./lms-context.service.js";
import { AppError } from "../utils/app-error.js";

async function getOfferingGraph(offeringId: string, userId: string) {
  const student = await requireStudentContext(userId);
  const offering = await prisma.moduleStudentClass.findFirst({
    where: {
      id: toBigIntId(offeringId, "Modul ID"),
      studentClassId: student.kelas.id,
      module: {
        isAktif: true
      }
    },
    include: {
      module: {
        include: {
          department: true
        }
      },
      teacher: true,
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
            orderBy: {
              submittedAt: "desc"
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
  });

  if (!offering) {
    throw new AppError("Modul tidak ditemukan", 404);
  }

  return offering;
}

function mapOfferingToModuleSummary(offering: Awaited<ReturnType<typeof getOfferingGraph>>) {
  const { sidebar } = buildSequentialSidebar({
    sections: offering.sections.map((section) => ({
      id: section.id,
      title: section.judul,
      description: "",
      order: section.urutan
    })),
    lessons: offering.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.judul,
      type: "lesson" as const,
      sectionId: lesson.sectionId,
      position: lesson.posisi,
      createdAt: lesson.createdAt,
      href: `/lessons/${lesson.id}`,
      availableAt: lesson.tersediaPada,
      isCompleted: lesson.lessonUsers.some((progress) => progress.isCompleted)
    })),
    quizzes: offering.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.judul,
      type: "quiz" as const,
      sectionId: quiz.sectionId,
      position: quiz.posisi,
      createdAt: quiz.createdAt,
      href: `/quizzes/${quiz.id}`,
      availableAt: quiz.availableAt,
      isCompleted: quiz.attempts.length > 0
    })),
    tasks: offering.tasks.map((task) => ({
      id: task.id,
      title: task.judul,
      type: "task" as const,
      sectionId: task.sectionId,
      position: task.posisi,
      createdAt: task.createdAt,
      href: `/tasks/${task.id}`,
      availableAt: task.availableAt,
      isCompleted: task.submissions.length > 0
    }))
  });

  const lessonCount = offering.lessons.length;
  const quizCount = offering.quizzes.length;
  const taskCount = offering.tasks.length;

  return {
    id: String(offering.id),
    title: offering.module.judul,
    department: offering.module.department.namaJurusan,
    teacherName: offering.teacher?.nama ?? "-",
    totalItems: sidebar.length,
    completionRate: computeCompletionPercent(sidebar),
    nextItemTitle: getNextItemTitle(sidebar),
    accent: "#0E5BFF",
    bannerLabel: `${lessonCount} lesson | ${quizCount} quiz | ${taskCount} task`
  };
}

export async function listStudentModules(userId: string) {
  const student = await requireStudentContext(userId);
  const offerings = await prisma.moduleStudentClass.findMany({
    where: {
      studentClassId: student.kelas.id,
      module: {
        isAktif: true
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      module: {
        include: {
          department: true
        }
      },
      teacher: true,
      sections: true,
      lessons: {
        where: {
          status: "published"
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
        include: {
          attempts: {
            where: {
              userId: student.userId,
              submittedAt: {
                not: null
              }
            },
            orderBy: {
              submittedAt: "desc"
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
  });

  return offerings.map(mapOfferingToModuleSummary);
}

export async function getStudentModuleDetail(offeringId: string, userId: string) {
  const offering = await getOfferingGraph(offeringId, userId);
  const summary = mapOfferingToModuleSummary(offering);
  const { groupedSections } = buildSequentialSidebar({
    sections: offering.sections.map((section) => ({
      id: section.id,
      title: section.judul,
      description: null,
      order: section.urutan
    })),
    lessons: offering.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.judul,
      type: "lesson" as const,
      sectionId: lesson.sectionId,
      position: lesson.posisi,
      createdAt: lesson.createdAt,
      href: `/lessons/${lesson.id}`,
      availableAt: lesson.tersediaPada,
      isCompleted: lesson.lessonUsers.some((progress) => progress.isCompleted)
    })),
    quizzes: offering.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.judul,
      type: "quiz" as const,
      sectionId: quiz.sectionId,
      position: quiz.posisi,
      createdAt: quiz.createdAt,
      href: `/quizzes/${quiz.id}`,
      availableAt: quiz.availableAt,
      isCompleted: quiz.attempts.length > 0
    })),
    tasks: offering.tasks.map((task) => ({
      id: task.id,
      title: task.judul,
      type: "task" as const,
      sectionId: task.sectionId,
      position: task.posisi,
      createdAt: task.createdAt,
      href: `/tasks/${task.id}`,
      availableAt: task.availableAt,
      isCompleted: task.submissions.length > 0
    }))
  });

  return {
    ...summary,
    description: offering.module.deskripsi ?? "",
    sections: groupedSections
  };
}

export async function listStudentCourses(userId: string) {
  return listStudentModules(userId);
}
