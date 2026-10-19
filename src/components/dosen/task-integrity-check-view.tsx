import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../dashboard/empty-state";
import { RefreshIcon } from "../dashboard/dashboard-icons";
import { IntegrityComparisonList } from "./integrity-comparison-list";
import { IntegrityDocumentPreview } from "./integrity-document-preview";
import { ReviewFlowHeader, ReviewWorkspace } from "./review-flow";
import {
  loadTaskIntegrityContext,
  loadTaskIntegrityPairDetail,
  loadTaskIntegrityPairVisual,
  type IntegrityCheckContext,
  type IntegrityPairDetail,
  type IntegrityPairVisual,
} from "../../lib/dosen-task-integrity";
import { retryDosenTaskSubmissionIntegrity } from "../../lib/learning-api";
import { cn } from "../../lib/utils";

type TaskIntegrityCheckViewProps = {
  taskId: string;
  submissionId: string;
  backHref: string;
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getStatusLabel(status: IntegrityCheckContext["originalityCheck"]["status"]) {
  switch (status) {
    case "queued":
      return "Masuk antrean";
    case "processing":
      return "Sedang diproses";
    case "completed":
      return "Pemeriksaan selesai";
    case "failed":
      return "Pemeriksaan gagal";
    default:
      return "Belum dijalankan";
  }
}

export function TaskIntegrityCheckView({
  taskId,
  submissionId,
  backHref,
}: TaskIntegrityCheckViewProps) {
  const [data, setData] = useState<IntegrityCheckContext | null>(null);
  const [activeComparisonId, setActiveComparisonId] = useState("");
  const [activeVisual, setActiveVisual] = useState<IntegrityPairVisual | null>(null);
  const [activeDetail, setActiveDetail] = useState<IntegrityPairDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVisual, setLoadingVisual] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const activeComparison = useMemo(
    () => data?.comparisons.find((comparison) => comparison.comparisonId === activeComparisonId) ?? null,
    [activeComparisonId, data?.comparisons]
  );

  async function loadData(isSilent = false) {
    if (!isSilent) {
      setLoading(true);
      setError("");
    }

    try {
      const response = await loadTaskIntegrityContext(submissionId);
      setData(response);
      setActiveComparisonId(
        (currentComparisonId) => currentComparisonId || response.comparisons[0]?.comparisonId || ""
      );
    } catch (loadError) {
      if (!isSilent) {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat integrity check.");
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadData(false);
  }, [submissionId]);

  useEffect(() => {
    if (!data) return undefined;

    const currentStatus = data.originalityCheck.status;
    if (currentStatus !== "queued" && currentStatus !== "processing") {
      return undefined;
    }

    const intervalId = setInterval(() => {
      void loadData(true);
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [submissionId, data?.originalityCheck.status]);

  useEffect(() => {
    if (!activeComparisonId || !data || data.originalityCheck.status !== "completed") {
      setActiveVisual(null);
      setActiveDetail(null);
      return;
    }

    let cancelled = false;
    setError("");
    setActiveVisual(null);
    setActiveDetail(null);
    setLoadingVisual(true);
    setLoadingDetail(false);

    void (async () => {
      let visualFailed = false;

      try {
        const visual = await loadTaskIntegrityPairVisual(submissionId, activeComparisonId);
        if (cancelled) return;
        setActiveVisual(visual);
      } catch (visualError) {
        if (cancelled) return;
        visualFailed = true;
        setActiveVisual(null);
        setError(
          visualError instanceof Error
            ? visualError.message
            : "Gagal memuat preview dokumen pembanding."
        );
      } finally {
        if (!cancelled) {
          setLoadingVisual(false);
        }
      }

      if (cancelled) return;

      setLoadingDetail(true);
      try {
        const detail = await loadTaskIntegrityPairDetail(submissionId, activeComparisonId);
        if (cancelled) return;
        setActiveDetail(detail);
      } catch (detailError) {
        if (cancelled) return;
        setActiveDetail(null);
        if (visualFailed) return;
        setError(
          detailError instanceof Error
            ? detailError.message
            : "Gagal memuat detail segmen pembanding."
        );
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeComparisonId, data, submissionId]);

  async function handleRetry() {
    setRetrying(true);
    setError("");

    try {
      await retryDosenTaskSubmissionIntegrity(submissionId);
      await loadData();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Gagal menjalankan retry.");
    } finally {
      setRetrying(false);
    }
  }

  const title = data?.currentSubmission.assignmentTitle || decodeURIComponent(taskId);

  return (
    <ReviewWorkspace wide>
      <ReviewFlowHeader
        backHref={backHref}
        backLabel="Kembali ke pengumpulan"
        title="Integrity Check"
        description="Bandingkan dokumen sumber dengan submission pembanding berdasarkan hasil engine originalitas."
      />

      {loading ? (
        <div className="flex min-h-[520px] items-center justify-center rounded-[12px] border border-[#e5e5e5] bg-white">
          <p className="text-[13px] text-slate-500">Memuat hasil pemeriksaan...</p>
        </div>
      ) : error && !data ? (
        <div className="flex min-h-[520px] items-center justify-center rounded-[12px] border border-[#e5e5e5] bg-white px-6">
          <p className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        </div>
      ) : data ? (
        <section className="flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white">
          <div className="border-b border-[#eeeeee] px-5 py-6 sm:px-6">
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-slate-950">{title}</h2>

            <dl className="mt-6 grid gap-y-5 border-y border-[#eeeeee] py-5 sm:grid-cols-2 sm:divide-x sm:divide-[#eeeeee] xl:grid-cols-4">
              <div className="min-w-0 sm:px-5 sm:first:pl-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Sumber</dt>
                <dd className="mt-2 truncate text-[14px] font-semibold text-slate-950">
                  {data.currentSubmission.studentName}
                </dd>
              </div>
              <div className="min-w-0 sm:px-5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Kemiripan tertinggi</dt>
                <dd className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-amber-700">
                  {formatPercent(data.originalityCheck.maxSimilarity)}
                </dd>
              </div>
              <div className="min-w-0 sm:px-5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Pembanding</dt>
                <dd className="mt-2 text-[16px] font-semibold text-slate-950">{data.comparisons.length} dokumen</dd>
              </div>
              <div className="min-w-0 sm:px-5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Status</dt>
                <dd className="mt-2 text-[14px] font-semibold text-slate-950">
                  {getStatusLabel(data.originalityCheck.status)}
                </dd>
              </div>
            </dl>

            {data.originalityCheck.status === "failed" ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshIcon className={cn("h-4 w-4", retrying && "animate-spin")} aria-hidden="true" />
                  {retrying ? "Menjalankan ulang..." : "Coba lagi"}
                </button>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-[12px] text-red-700">
              {error}
            </div>
          ) : null}

          {data.originalityCheck.status !== "completed" ? (
            <div className="flex min-h-[470px] items-center justify-center px-6 py-12">
              <EmptyState
                title={getStatusLabel(data.originalityCheck.status)}
                description="Preview dokumen akan tersedia setelah engine menyelesaikan ekstraksi dan perbandingan."
              />
            </div>
          ) : data.comparisons.length === 0 ? (
            <div className="flex min-h-[470px] items-center justify-center px-6 py-12">
              <EmptyState
                title="Belum ada dokumen pembanding"
                description="Engine selesai memproses submission ini tetapi belum menemukan pasangan dokumen untuk ditinjau."
              />
            </div>
          ) : (
            <>
              <div className="grid min-h-0 flex-1 gap-4 bg-[#f5f5f5] p-4 xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
                <IntegrityComparisonList
                  items={data.comparisons}
                  activeDocumentId={activeComparisonId}
                  onSelect={setActiveComparisonId}
                />
                <IntegrityDocumentPreview
                  label="Dokumen sumber"
                  studentName={data.currentSubmission.studentName}
                  fileName={data.currentSubmission.submissionFile?.fileName ?? data.currentSubmission.assignmentTitle}
                  similarityScore={null}
                  document={
                    activeVisual?.sourceDocument ?? {
                      id: null,
                      side: "A",
                      fileName: null,
                      annotatedPdfUrl: null,
                      layoutMap: null,
                      highlights: [],
                    }
                  }
                />
                {activeComparison ? (
                  <IntegrityDocumentPreview
                    label={loadingVisual ? "Memuat dokumen pembanding..." : "Dokumen pembanding"}
                    studentName={activeComparison.studentName}
                    fileName={activeComparison.documentLabel}
                    similarityScore={activeComparison.similarityScore}
                    document={
                      activeVisual?.comparisonDocument ?? {
                        id: null,
                        side: "B",
                        fileName: null,
                        annotatedPdfUrl: null,
                        layoutMap: null,
                        highlights: [],
                      }
                    }
                  />
                ) : null}
              </div>
              {loadingDetail ? (
                <div className="border-t border-[#eeeeee] bg-white px-5 py-4 text-[12px] text-slate-500">
                  Memuat detail segmen pembanding...
                </div>
              ) : activeDetail?.highlights.length ? (
                <div className="border-t border-[#eeeeee] bg-white px-5 py-6 sm:px-6">
                  <div className="mb-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Segmen mirip
                    </p>
                    <h2 className="mt-1 text-[16px] font-semibold text-slate-950">
                      Cuplikan teks pembanding
                    </h2>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {activeDetail.highlights.slice(0, 8).map((highlight, index) => (
                      <article
                        key={`${activeDetail.comparisonId}-${index}`}
                        className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4"
                      >
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Dokumen sumber
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-950">{highlight.sourceText}</p>
                        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Dokumen pembanding
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-950">
                          {highlight.comparisonText}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </ReviewWorkspace>
  );
}
