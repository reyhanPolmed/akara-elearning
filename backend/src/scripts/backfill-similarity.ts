import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import {
  enqueueTaskSubmissionSimilarityCheck,
  runSimilarityWorkerCycle,
} from "../services/winnowing.service.js";

const DEFAULT_SUBMISSION_IDS = ["16", "17", "18", "19"];
const FINAL_STATUSES = new Set(["completed", "failed"]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSubmissionIds() {
  const fromArgs = process.argv.slice(2).filter(Boolean);
  return (fromArgs.length ? fromArgs : DEFAULT_SUBMISSION_IDS).map((value) => BigInt(value));
}

async function readSubmissionChecks(submissionIds: bigint[]) {
  return prisma.taskSubmission.findMany({
    where: { id: { in: submissionIds } },
    orderBy: { id: "asc" },
    include: {
      user: { select: { name: true } },
      task: { select: { judul: true } },
      similarityCheck: true,
    },
  });
}

function printSnapshot(label: string, rows: Awaited<ReturnType<typeof readSubmissionChecks>>) {
  console.log(`\n=== ${label} ===`);
  for (const row of rows) {
    console.log(
      JSON.stringify({
        id: String(row.id),
        student: row.user.name,
        task: row.task.judul,
        submittedAt: row.submittedAt?.toISOString() ?? null,
        similarityCheck: row.similarityCheck
          ? {
              similarityStatus: row.similarityCheck.similarityStatus,
              providerStatus: row.similarityCheck.providerStatus,
              documentId: row.similarityCheck.similarityDocumentId,
              error: row.similarityCheck.similarityError,
              updatedAt: row.similarityCheck.updatedAt.toISOString(),
            }
          : null,
      })
    );
  }
}

async function main() {
  const submissionIds = parseSubmissionIds();

  if (!env.WINNOWING_API_BASE_URL || !env.WINNOWING_TENANT_ID) {
    throw new Error("WINNOWING API belum dikonfigurasi di environment backend.");
  }

  const existingRows = await readSubmissionChecks(submissionIds);
  if (existingRows.length === 0) {
    throw new Error("Submission target tidak ditemukan.");
  }

  printSnapshot("Before Backfill", existingRows);

  for (const submissionId of submissionIds) {
    await enqueueTaskSubmissionSimilarityCheck(submissionId);
  }

  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await runSimilarityWorkerCycle();
    const rows = await readSubmissionChecks(submissionIds);
    printSnapshot(`Cycle ${attempt}`, rows);

    const allFinal = rows.every((row) =>
      row.similarityCheck
        ? FINAL_STATUSES.has(row.similarityCheck.similarityStatus)
        : false
    );

    if (allFinal) {
      break;
    }

    await sleep(Math.max(1500, Math.min(env.WINNOWING_SYNC_INTERVAL_MS, 5000)));
  }

  const finalRows = await readSubmissionChecks(submissionIds);
  printSnapshot("Final Snapshot", finalRows);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
