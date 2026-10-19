import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

type SectionInput = {
  id: bigint | string;
  title: string;
  description: string | null;
  order: number;
};

type ContentInput = {
  id: bigint | string;
  title: string;
  type: "lesson" | "quiz" | "task";
  sectionId: bigint | string | null;
  position: number;
  createdAt?: Date | null;
  href: string;
  availableAt?: Date | null;
  isCompleted: boolean;
};

export function toBigIntId(value: bigint | number | string, label = "ID") {
  try {
    return BigInt(value);
  } catch {
    throw new AppError(`${label} tidak valid`, 422);
  }
}

export async function requireStudentContext(userId: string) {
  const normalizedUserId = toBigIntId(userId, "User ID");
  const student = await prisma.student.findFirst({
    where: {
      userId: normalizedUserId
    },
    include: {
      user: true,
      kelas: {
        include: {
          jurusan: true,
          tingkat: true
        }
      },
      jurusan: true,
      tingkat: true
    }
  });

  if (!student?.kelas) {
    throw new AppError("Akun ini belum terhubung ke kelas mahasiswa", 403);
  }

  return {
    ...student,
    kelas: student.kelas
  };
}

export async function requireOfferingForStudent(offeringId: string, userId: string) {
  const student = await requireStudentContext(userId);
  const offering = await prisma.moduleStudentClass.findFirst({
    where: {
      id: toBigIntId(offeringId, "Modul ID"),
      studentClassId: student.kelas.id
    }
  });

  if (!offering) {
    throw new AppError("Akses ke modul ini ditolak", 403);
  }

  return student;
}

export function buildSequentialSidebar(input: {
  sections: SectionInput[];
  lessons: ContentInput[];
  quizzes: ContentInput[];
  tasks: ContentInput[];
}) {
  const sectionMap = new Map(input.sections.map((section) => [String(section.id), section]));
  const typeWeight = {
    lesson: 0,
    quiz: 1,
    task: 2
  } as const;

  const orderedItems = [...input.lessons, ...input.quizzes, ...input.tasks].sort((left, right) => {
    const leftSectionOrder = sectionMap.get(String(left.sectionId ?? ""))?.order ?? Number.MAX_SAFE_INTEGER;
    const rightSectionOrder = sectionMap.get(String(right.sectionId ?? ""))?.order ?? Number.MAX_SAFE_INTEGER;

    if (leftSectionOrder !== rightSectionOrder) {
      return leftSectionOrder - rightSectionOrder;
    }

    if (left.position !== right.position) {
      return left.position - right.position;
    }

    const leftCreatedAt = left.createdAt?.getTime() ?? Number.NaN;
    const rightCreatedAt = right.createdAt?.getTime() ?? Number.NaN;
    const hasComparableCreatedAt = Number.isFinite(leftCreatedAt) && Number.isFinite(rightCreatedAt);

    if (hasComparableCreatedAt && leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return typeWeight[left.type] - typeWeight[right.type];
  });

  let shouldLockFollowing = false;

  const sidebar = orderedItems.map((item) => {
    const section = sectionMap.get(String(item.sectionId ?? ""));
    const isLocked = shouldLockFollowing || Boolean(item.availableAt && item.availableAt > new Date());

    if (!item.isCompleted) {
      shouldLockFollowing = true;
    }

    return {
      id: String(item.id),
      title: item.title,
      type: item.type,
      href: item.href,
      isLocked,
      isCompleted: item.isCompleted,
      chapter: section?.title ?? "Tanpa section"
    };
  });

  const groupedSections = [...input.sections]
    .sort((left, right) => left.order - right.order)
    .map((section) => ({
      id: String(section.id),
      title: section.title,
      description: section.description ?? "",
      items: sidebar.filter((item) => item.chapter === section.title)
    }));

  return {
    sidebar,
    groupedSections
  };
}

export function computeCompletionPercent(
  items: Array<{
    isCompleted: boolean;
  }>
) {
  if (items.length === 0) {
    return 0;
  }

  const completed = items.filter((item) => item.isCompleted).length;
  return Math.round((completed / items.length) * 100);
}

export function getNextItemTitle(
  items: Array<{
    title: string;
    isCompleted: boolean;
    isLocked?: boolean;
  }>
) {
  return items.find((item) => !item.isCompleted && !item.isLocked)?.title ??
    items.find((item) => !item.isCompleted)?.title ??
    "Semua item selesai";
}

export function ensureStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}
