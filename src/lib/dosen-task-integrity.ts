import { resolveApiUrl } from "./api-client";
import type {
  DosenTaskSubmissionDetail,
  IntegrityVisualContext,
  OriginalityCheckSummary,
} from "./learning-api";
import {
  getDosenTaskSubmissionDetail,
  getDosenTaskSubmissionIntegrityPairDetail,
  getDosenTaskSubmissionIntegrityPairVisual,
  getDosenTaskSubmissionIntegritySummary,
  listDosenTaskSubmissionIntegrityPairs,
} from "./learning-api";

type UnknownRecord = Record<string, unknown>;

export type IntegrityPairSummary = {
  comparisonId: string;
  studentName: string;
  documentLabel: string;
  similarityScore: number;
  similarityLevel: string | null;
};

export type IntegrityHighlight = {
  sourceText: string;
  comparisonText: string;
};

export type IntegrityPairDetail = {
  comparisonId: string;
  similarityScore: number;
  jaccardScore: number;
  containmentScoreA: number;
  containmentScoreB: number;
  matchedFingerprintCount: number;
  highlights: IntegrityHighlight[];
  rawPayload: string;
};

export type IntegrityPreviewAsset = {
  id: string | null;
  side: "A" | "B";
  fileName: string | null;
  annotatedPdfUrl: string | null;
  layoutMap: {
    kind: string | null;
    pages: Array<{
      pageIndex: number;
      width: number;
      height: number;
      imageUrl: string | null;
      pdfWidth: number;
      pdfHeight: number;
    }>;
  } | null;
  highlights: Array<{
    pageIndex: number;
    text: string | null;
    bboxNormalized: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    } | null;
  }>;
};

export type IntegrityPairVisual = {
  comparisonId: string;
  similarityScore: number;
  similarityLevel: string | null;
  matchedFingerprintCount: number;
  sourceDocument: IntegrityPreviewAsset;
  comparisonDocument: IntegrityPreviewAsset;
};

export type IntegrityCheckContext = {
  originalityCheck: OriginalityCheckSummary;
  currentSubmission: DosenTaskSubmissionDetail;
  comparisons: IntegrityPairSummary[];
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
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

function toPercentage(value: number) {
  return value > 0 && value <= 1 ? value * 100 : value;
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

function extractPeerRecord(record: UnknownRecord) {
  for (const key of [
    "pairedDocument",
    "peerDocument",
    "matchedDocument",
    "comparedDocument",
    "targetDocument",
    "documentB",
    "document2",
  ]) {
    const candidate = asRecord(record[key]);
    if (Object.keys(candidate).length > 0) return candidate;
  }

  return {};
}

function normalizePair(value: unknown, index: number): IntegrityPairSummary {
  const record = asRecord(value);
  const peer = extractPeerRecord(record);
  const metadata = asRecord(peer.metadata);
  const comparisonId =
    pickString(record, ["comparisonId", "comparison_id", "id"]) ?? `comparison-${index + 1}`;
  const externalId =
    pickString(peer, ["externalId", "external_id", "submissionId", "submission_id"]) ??
    `Dokumen ${index + 1}`;

  return {
    comparisonId,
    studentName:
      pickString(metadata, ["studentName", "student_name"]) ??
      pickString(peer, ["studentName", "student_name"]) ??
      externalId,
    documentLabel:
      pickString(peer, ["title", "fileName", "file_name", "name"]) ??
      `Submission ${externalId}`,
    similarityScore: toPercentage(
      pickNumber(record, ["similarityScore", "similarity_score", "maxSimilarity", "score"])
    ),
    similarityLevel: pickString(record, ["similarityLevel", "similarity_level", "level"]),
  };
}

function normalizeHighlights(record: UnknownRecord) {
  const source = record.highlights ?? record.matches ?? record.matchedSegments ?? record.segments;
  if (!Array.isArray(source)) return [];

  return source
    .map<IntegrityHighlight | null>((item) => {
      const segment = asRecord(item);
      const sourceText = pickString(segment, [
        "sourceText",
        "source_text",
        "textA",
        "text_a",
        "leftText",
      ]);
      const comparisonText = pickString(segment, [
        "comparisonText",
        "comparison_text",
        "textB",
        "text_b",
        "rightText",
      ]);

      return sourceText && comparisonText ? { sourceText, comparisonText } : null;
    })
    .filter((item): item is IntegrityHighlight => item !== null);
}

function normalizePreviewAsset(
  document: IntegrityVisualContext["sourceDocument"] | IntegrityVisualContext["comparisonDocument"]
): IntegrityPreviewAsset {
  return {
    id: document.id,
    side: document.side,
    fileName: document.fileName,
    annotatedPdfUrl: resolveApiUrl(document.annotatedPdfUrl),
    layoutMap: document.layoutMap
      ? {
          kind: document.layoutMap.kind,
          pages: document.layoutMap.pages.map((page) => ({
            ...page,
            imageUrl: resolveApiUrl(page.imageUrl),
          })),
        }
      : null,
    highlights: Array.isArray(document.highlights) ? document.highlights : [],
  };
}

export async function loadTaskIntegrityContext(submissionId: string) {
  const [currentSubmission, originalityCheck, rawPairs] = await Promise.all([
    getDosenTaskSubmissionDetail(submissionId),
    getDosenTaskSubmissionIntegritySummary(submissionId),
    listDosenTaskSubmissionIntegrityPairs(submissionId),
  ]);

  return {
    currentSubmission,
    originalityCheck,
    comparisons: unwrapList(rawPairs).map(normalizePair),
  } satisfies IntegrityCheckContext;
}

export async function loadTaskIntegrityPairDetail(submissionId: string, comparisonId: string) {
  const payload = await getDosenTaskSubmissionIntegrityPairDetail(submissionId, comparisonId);
  const record = unwrapRecord(payload);

  return {
    comparisonId,
    similarityScore: toPercentage(pickNumber(record, ["similarityScore", "similarity_score", "score"])),
    jaccardScore: toPercentage(pickNumber(record, ["jaccardScore", "jaccard_score"])),
    containmentScoreA: toPercentage(pickNumber(record, ["containmentScoreA", "containment_score_a"])),
    containmentScoreB: toPercentage(pickNumber(record, ["containmentScoreB", "containment_score_b"])),
    matchedFingerprintCount: pickNumber(record, [
      "matchedFingerprintCount",
      "matched_fingerprint_count",
    ]),
    highlights: normalizeHighlights(record),
    rawPayload: JSON.stringify(payload, null, 2),
  } satisfies IntegrityPairDetail;
}

export async function loadTaskIntegrityPairVisual(submissionId: string, comparisonId: string) {
  const payload = await getDosenTaskSubmissionIntegrityPairVisual(submissionId, comparisonId);

  return {
    comparisonId: payload.comparisonId,
    similarityScore: toPercentage(payload.similarityScore),
    similarityLevel: payload.similarityLevel,
    matchedFingerprintCount: payload.matchedFingerprintCount,
    sourceDocument: normalizePreviewAsset(payload.sourceDocument),
    comparisonDocument: normalizePreviewAsset(payload.comparisonDocument),
  } satisfies IntegrityPairVisual;
}
