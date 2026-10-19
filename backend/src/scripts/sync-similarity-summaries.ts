import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { syncSimilaritySummaryFromPairs } from "../services/winnowing.service.js";

const DEFAULT_SUBMISSION_IDS = ["16", "17", "18", "19"];

function parseSubmissionIds() {
  const args = process.argv.slice(2).filter(Boolean);
  return (args.length ? args : DEFAULT_SUBMISSION_IDS).map((value) => BigInt(value));
}

async function main() {
  if (!env.WINNOWING_API_BASE_URL || !env.WINNOWING_TENANT_ID) {
    throw new Error("WINNOWING API belum dikonfigurasi di environment backend.");
  }

  const submissionIds = parseSubmissionIds();
  const checks = await prisma.taskSubmissionSimilarityCheck.findMany({
    where: {
      taskSubmissionId: { in: submissionIds },
      similarityDocumentId: { not: null },
    },
    orderBy: { taskSubmissionId: "asc" },
    include: {
      submission: {
        include: {
          user: { select: { name: true } },
          task: { select: { judul: true } },
        },
      },
    },
  });

  if (checks.length === 0) {
    throw new Error("Submission target belum memiliki documentId provider.");
  }

  for (const check of checks) {
    const updated = await syncSimilaritySummaryFromPairs(check);
    console.log(
      JSON.stringify({
        submissionId: String(updated.taskSubmissionId),
        student: check.submission.user.name,
        task: check.submission.task.judul,
        documentId: updated.similarityDocumentId,
        maxSimilarity: updated.maxSimilarity,
        similarityLevel: updated.similarityLevel,
        providerStatus: updated.providerStatus,
      })
    );
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
