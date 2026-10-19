import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function getNextMixedItemPosition(
  db: DbClient,
  params: {
    offeringId: bigint;
    sectionId: bigint | null;
  }
) {
  const sectionFilter =
    params.sectionId === null ? { sectionId: null } : { sectionId: params.sectionId };

  const [lessonMax, quizMax, taskMax] = await Promise.all([
    db.lesson.aggregate({
      where: {
        moduleStudentClassId: params.offeringId,
        ...sectionFilter,
      },
      _max: { posisi: true },
    }),
    db.quiz.aggregate({
      where: {
        modulesStudentClassId: params.offeringId,
        ...sectionFilter,
      },
      _max: { posisi: true },
    }),
    db.task.aggregate({
      where: {
        modulesStudentClassId: params.offeringId,
        ...sectionFilter,
      },
      _max: { posisi: true },
    }),
  ]);

  return Math.max(
    lessonMax._max.posisi ?? 0,
    quizMax._max.posisi ?? 0,
    taskMax._max.posisi ?? 0
  ) + 1;
}
