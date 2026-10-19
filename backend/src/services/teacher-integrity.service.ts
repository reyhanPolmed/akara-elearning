import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { toBigIntId } from "./lms-context.service.js";
import { requireTeacherContext } from "./teacher-context.service.js";
import {
  buildOriginalitySummary,
  fetchTaskSubmissionIntegrityAsset,
  getTaskSubmissionIntegrityComparison,
  getTaskSubmissionIntegrityComparisonVisual,
  getTaskSubmissionIntegrityPairs,
  retryTaskSubmissionIntegrityCheck,
  syncSimilaritySummaryFromPairs,
} from "./winnowing.service.js";

type UnknownRecord = Record<string, unknown>;
type CachedComparisonContext = {
  expiresAt: number;
  similarityDocumentId: string;
  pair: UnknownRecord;
};

export type IntegrityAssetSide = "A" | "B";
const COMPARISON_CONTEXT_TTL_MS = 2 * 60_000;
const comparisonContextCache = new Map<string, CachedComparisonContext>();

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function unwrapRecord(value: unknown) {
  const record = asRecord(value);
  return Object.keys(asRecord(record.data)).length > 0 ? asRecord(record.data) : record;
}

function unwrapList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  const record = unwrapRecord(value);
  for (const key of ["pairs", "comparisons", "items", "results", "data"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }

  return [];
}

function pickString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return null;
}

function pickNumber(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return 0;
}

function containsComparisonId(value: unknown, comparisonId: string): boolean {
  if (typeof value === "string") return value === comparisonId;
  if (Array.isArray(value)) return value.some((item) => containsComparisonId(item, comparisonId));
  if (!value || typeof value !== "object") return false;

  return Object.values(value).some((item) => containsComparisonId(item, comparisonId));
}

function findComparisonRecord(value: unknown, comparisonId: string): UnknownRecord | null {
  return (
    unwrapList(value).find((item) => {
      const record = asRecord(item);
      return (
        pickString(record, ["id", "comparisonId", "comparison_id"]) === comparisonId
      );
    }) as UnknownRecord | undefined
  ) ?? null;
}

function getPeerRecord(record: UnknownRecord): UnknownRecord | null {
  for (const key of [
    "pairedDocument",
    "peerDocument",
    "matchedDocument",
    "comparedDocument",
    "targetDocument",
    "documentB",
    "document2",
  ]) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as UnknownRecord;
    }
  }

  return null;
}

function buildComparisonContextCacheKey(
  submissionId: string,
  comparisonId: string,
  userId: string
) {
  return `${userId}:${submissionId}:${comparisonId}`;
}

function getCachedComparisonContext(
  submissionId: string,
  comparisonId: string,
  userId: string
) {
  const key = buildComparisonContextCacheKey(submissionId, comparisonId, userId);
  const cached = comparisonContextCache.get(key);

  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    comparisonContextCache.delete(key);
    return null;
  }

  return cached;
}

function rememberComparisonContext(
  submissionId: string,
  comparisonId: string,
  userId: string,
  similarityDocumentId: string,
  pair: UnknownRecord
) {
  comparisonContextCache.set(
    buildComparisonContextCacheKey(submissionId, comparisonId, userId),
    {
      expiresAt: Date.now() + COMPARISON_CONTEXT_TTL_MS,
      similarityDocumentId,
      pair,
    }
  );
}

function normalizeVisualPages(
  value: unknown,
  submissionId: string,
  comparisonId: string,
  side: IntegrityAssetSide
) {
  const layoutMap = asRecord(value);
  const pages = Array.isArray(layoutMap.pages) ? layoutMap.pages : [];

  if (!pages.length) return null;

  return {
    kind: pickString(layoutMap, ["kind", "type"]),
    pages: pages.map((page) => {
      const record = asRecord(page);
      const visualImagePath = pickString(record, ["imageUrl", "image_url"]);

      return {
        pageIndex: pickNumber(record, ["pageIndex", "page_index"]),
        width: pickNumber(record, ["width"]),
        height: pickNumber(record, ["height"]),
        imageUrl: buildIntegrityAssetProxyPath(
          submissionId,
          comparisonId,
          side,
          visualImagePath
        ),
        pdfWidth: pickNumber(record, ["pdfWidth", "pdf_width"]),
        pdfHeight: pickNumber(record, ["pdfHeight", "pdf_height"]),
      };
    }),
  };
}

function normalizeVisualPagesFromHighlights(
  value: unknown,
  submissionId: string,
  comparisonId: string,
  side: IntegrityAssetSide
) {
  if (!Array.isArray(value)) return null;

  const imagePaths = Array.from(
    new Set(
      value
        .map((item) => pickString(asRecord(item), ["imageUrl", "image_url"]))
        .filter((item): item is string => Boolean(item))
    )
  );

  if (!imagePaths.length) return null;

  return {
    kind: "highlight-image",
    pages: imagePaths.map((assetPath, index) => ({
      pageIndex: index,
      width: 0,
      height: 0,
      imageUrl: buildIntegrityAssetProxyPath(
        submissionId,
        comparisonId,
        side,
        assetPath
      ),
      pdfWidth: 0,
      pdfHeight: 0,
    })),
  };
}

function normalizeVisualHighlights(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      const bbox = asRecord(record.bboxNormalized ?? record.bbox_normalized);
      const x1 = pickNumber(bbox, ["x1"]);
      const y1 = pickNumber(bbox, ["y1"]);
      const x2 = pickNumber(bbox, ["x2"]);
      const y2 = pickNumber(bbox, ["y2"]);
      const hasValidBox = [x1, y1, x2, y2].every(Number.isFinite) && x2 > x1 && y2 > y1;

      return {
        pageIndex: pickNumber(record, ["pageIndex", "page_index"]),
        text: pickString(record, ["text", "content", "label"]),
        bboxNormalized: hasValidBox ? { x1, y1, x2, y2 } : null,
      };
    })
    .filter((item) => item.bboxNormalized !== null);
}

function getVisualDocumentRecord(visual: UnknownRecord | null, side: IntegrityAssetSide) {
  if (!visual) return {};
  return asRecord(side === "A" ? visual.documentA : visual.documentB);
}

function parseNumericBigInt(value: string | null) {
  return value && /^\d+$/.test(value) ? BigInt(value) : null;
}

async function enrichPairsWithLmsMetadata(payload: unknown) {
  const root = asRecord(payload);
  const pairValues = Array.isArray(root.pairs)
    ? (root.pairs as unknown[])
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  const userIds = pairValues
    .map((item) => {
      const pair = asRecord(item);
      const peer = getPeerRecord(pair);
      return parseNumericBigInt(pickString(peer ?? {}, ["studentId", "student_id"]));
    })
    .filter((value): value is bigint => value !== null);

  if (userIds.length === 0) return payload;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      students: {
        take: 1,
        select: {
          kelas: {
            select: {
              namaKelas: true,
            },
          },
        },
      },
    },
  });
  const userMap = new Map(users.map((user) => [String(user.id), user]));

  for (const item of pairValues) {
    const pair = asRecord(item);
    const peer = getPeerRecord(pair);
    if (!peer) continue;

    const studentId = pickString(peer, ["studentId", "student_id"]);
    if (!studentId) continue;

    const user = userMap.get(studentId);
    if (!user) continue;

    const metadata = asRecord(peer.metadata);
    peer.metadata = {
      ...metadata,
      studentName: pickString(metadata, ["studentName", "student_name"]) ?? user.name,
      className:
        pickString(metadata, ["className", "class_name"]) ??
        user.students[0]?.kelas?.namaKelas ??
        null,
    };

    if (!pickString(peer, ["studentName", "student_name"])) {
      peer.studentName = user.name;
    }
  }

  return payload;
}

async function getTeacherSubmissionRecord(submissionId: string, userId: string) {
  const teacher = await requireTeacherContext(userId);
  const submission = await prisma.taskSubmission.findFirst({
    where: {
      id: toBigIntId(submissionId, "Submission ID"),
      task: { moduleStudentClass: { teacherId: teacher.id } },
    },
    include: {
      similarityCheck: true,
    },
  });

  if (!submission) {
    throw new AppError("Submission tidak ditemukan atau tidak bisa diakses", 404);
  }

  return submission;
}

function buildIntegrityAssetProxyPath(
  submissionId: string,
  comparisonId: string,
  side: IntegrityAssetSide,
  assetPath?: string | null
) {
  const basePath = `/api/teacher/task-submissions/${encodeURIComponent(submissionId)}/integrity-pairs/${encodeURIComponent(comparisonId)}/documents/${side}`;
  return assetPath
    ? `${basePath}/visual-asset?path=${encodeURIComponent(assetPath)}`
    : null;
}

function resolveSourceSide(
  detail: UnknownRecord,
  similarityDocumentId: string
): IntegrityAssetSide {
  const documentAId = pickString(detail, ["documentAId", "document_a_id"]);
  const documentBId = pickString(detail, ["documentBId", "document_b_id"]);

  if (documentAId === similarityDocumentId) return "A";
  if (documentBId === similarityDocumentId) return "B";

  throw new AppError("Dokumen sumber tidak cocok dengan hasil comparison provider", 409);
}

async function getValidatedComparisonContext(
  submissionId: string,
  comparisonId: string,
  userId: string
) {
  const cached = getCachedComparisonContext(submissionId, comparisonId, userId);
  if (cached) {
    return {
      similarityDocumentId: cached.similarityDocumentId,
      pair: cached.pair,
    };
  }

  const submission = await getTeacherSubmissionRecord(submissionId, userId);
  const check = submission.similarityCheck;

  if (!check?.similarityDocumentId || check.similarityStatus !== "completed") {
    throw new AppError("Hasil pemeriksaan kemiripan belum tersedia", 409);
  }

  const pairs = await getTaskSubmissionIntegrityPairs(check.similarityDocumentId);
  const pair = findComparisonRecord(pairs.data, comparisonId);

  if (!pair || !containsComparisonId(pairs.data, comparisonId)) {
    throw new AppError("Comparison tidak ditemukan atau tidak bisa diakses", 404);
  }

  rememberComparisonContext(
    submissionId,
    comparisonId,
    userId,
    check.similarityDocumentId,
    pair
  );

  return {
    similarityDocumentId: check.similarityDocumentId,
    pair,
  };
}

export async function getTaskSubmissionIntegritySummary(submissionId: string, userId: string) {
  const submission = await getTeacherSubmissionRecord(submissionId, userId);
  let check = submission.similarityCheck;

  if (check && check.similarityStatus === "completed" && check.similarityDocumentId) {
    try {
      check = await syncSimilaritySummaryFromPairs(check);
    } catch (error) {
      // Silently fallback if Winnowing API is offline
    }
  }

  return buildOriginalitySummary(check);
}

export async function listTaskSubmissionIntegrityPairs(submissionId: string, userId: string) {
  const submission = await getTeacherSubmissionRecord(submissionId, userId);
  const check = submission.similarityCheck;

  if (!check?.similarityDocumentId || check.similarityStatus !== "completed") {
    return [];
  }

  const response = await getTaskSubmissionIntegrityPairs(check.similarityDocumentId);
  const enriched = await enrichPairsWithLmsMetadata(response.data);

  for (const item of unwrapList(enriched)) {
    const pair = asRecord(item);
    const comparisonId = pickString(pair, ["id", "comparisonId", "comparison_id"]);
    if (!comparisonId) continue;

    rememberComparisonContext(
      submissionId,
      comparisonId,
      userId,
      check.similarityDocumentId,
      pair
    );
  }

  return enriched;
}

export async function getTaskSubmissionIntegrityPairDetail(
  submissionId: string,
  comparisonId: string,
  userId: string
) {
  await getValidatedComparisonContext(submissionId, comparisonId, userId);
  const detailResponse = await getTaskSubmissionIntegrityComparison(comparisonId);
  return unwrapRecord(detailResponse.data);
}

export async function getTaskSubmissionIntegrityPairVisual(
  submissionId: string,
  comparisonId: string,
  userId: string
) {
  const { similarityDocumentId, pair } = await getValidatedComparisonContext(
    submissionId,
    comparisonId,
    userId
  );
  let visual: UnknownRecord | null = null;

  try {
    const visualResponse = await getTaskSubmissionIntegrityComparisonVisual(comparisonId);
    visual = unwrapRecord(visualResponse.data);
  } catch {
    visual = null;
  }

  const sourceSide = resolveSourceSide(pair, similarityDocumentId);
  const comparisonSide: IntegrityAssetSide = sourceSide === "A" ? "B" : "A";
  const sourceVisualDocument = getVisualDocumentRecord(visual, sourceSide);
  const comparisonVisualDocument = getVisualDocumentRecord(visual, comparisonSide);
  const sourceDocumentId =
    pickString(sourceVisualDocument, ["id", "documentId", "document_id"]) ??
    (sourceSide === "A"
      ? pickString(pair, ["documentAId", "document_a_id"])
      : pickString(pair, ["documentBId", "document_b_id"]));
  const comparisonDocumentId =
    pickString(comparisonVisualDocument, ["id", "documentId", "document_id"]) ??
    (comparisonSide === "A"
      ? pickString(pair, ["documentAId", "document_a_id"])
      : pickString(pair, ["documentBId", "document_b_id"]));
  const sourceLayoutMap =
    normalizeVisualPages(
      sourceVisualDocument.layoutMap,
      submissionId,
      comparisonId,
      sourceSide
    ) ??
    normalizeVisualPagesFromHighlights(
      sourceVisualDocument.highlights,
      submissionId,
      comparisonId,
      sourceSide
    );
  const comparisonLayoutMap =
    normalizeVisualPages(
      comparisonVisualDocument.layoutMap,
      submissionId,
      comparisonId,
      comparisonSide
    ) ??
    normalizeVisualPagesFromHighlights(
      comparisonVisualDocument.highlights,
      submissionId,
      comparisonId,
      comparisonSide
    );

  return {
    comparisonId,
    similarityScore: pickNumber(pair, ["similarityScore", "similarity_score", "score"]),
    similarityLevel: pickString(pair, ["similarityLevel", "similarity_level", "level"]),
    matchedFingerprintCount: pickNumber(pair, [
      "matchedFingerprintCount",
      "matched_fingerprint_count",
    ]),
    sourceDocument: {
      id: sourceDocumentId,
      side: sourceSide,
      fileName: pickString(sourceVisualDocument, ["fileName", "file_name", "title", "name"]),
      annotatedPdfUrl: buildIntegrityAssetProxyPath(
        submissionId,
        comparisonId,
        sourceSide,
        pickString(sourceVisualDocument, ["annotatedPdfUrl", "annotated_pdf_url"])
      ),
      layoutMap: sourceLayoutMap,
      highlights: normalizeVisualHighlights(sourceVisualDocument.highlights),
    },
    comparisonDocument: {
      id: comparisonDocumentId,
      side: comparisonSide,
      fileName: pickString(comparisonVisualDocument, ["fileName", "file_name", "title", "name"]),
      annotatedPdfUrl: buildIntegrityAssetProxyPath(
        submissionId,
        comparisonId,
        comparisonSide,
        pickString(comparisonVisualDocument, ["annotatedPdfUrl", "annotated_pdf_url"])
      ),
      layoutMap: comparisonLayoutMap,
      highlights: normalizeVisualHighlights(comparisonVisualDocument.highlights),
    },
  };
}

export async function getTaskSubmissionIntegrityVisualAsset(
  submissionId: string,
  comparisonId: string,
  side: IntegrityAssetSide,
  userId: string,
  rawAssetPath?: string | null
) {
  const cached = getCachedComparisonContext(submissionId, comparisonId, userId);
  if (!cached) {
    await getValidatedComparisonContext(submissionId, comparisonId, userId);
  }
  let providerPath: string | null = null;

  if (
    rawAssetPath?.startsWith("/api/v1/ocr-assets/") ||
    rawAssetPath?.startsWith("/static/results/") ||
    rawAssetPath?.startsWith("/api/v1/comparisons/") ||
    rawAssetPath?.startsWith("/api/v1/documents/")
  ) {
    providerPath = rawAssetPath;
  }

  if (!providerPath) {
    throw new AppError("Aset preview dokumen tidak tersedia", 404);
  }

  return fetchTaskSubmissionIntegrityAsset(providerPath);
}

export async function retryTaskSubmissionIntegrity(submissionId: string, userId: string) {
  const submission = await getTeacherSubmissionRecord(submissionId, userId);
  const check = submission.similarityCheck;

  if (!check) {
    throw new AppError("Pemeriksaan kemiripan belum tersedia untuk submission ini", 404);
  }

  await retryTaskSubmissionIntegrityCheck(check);
  return getTaskSubmissionIntegritySummary(submissionId, userId);
}
