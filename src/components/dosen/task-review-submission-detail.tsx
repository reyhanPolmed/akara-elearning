import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ArrowUpRightIcon, FileCheckIcon } from "../dashboard/dashboard-icons";
import { StatusBadge } from "../status-badge";
import { ReviewFlowHeader, ReviewWorkspace } from "./review-flow";
import { getTaskReviewLabel, getTaskReviewTone } from "../../lib/dosen-review-flow";
import { getDosenTaskSubmissionDetail, gradeDosenTaskSubmission, type DosenTaskSubmissionDetail } from "../../lib/learning-api";

type TaskReviewSubmissionDetailProps = {
  submissionId: string;
  backHref: string;
  integrityHref?: string;
};

function getOriginalityLabel(status: string) {
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

function getOriginalityTone(status: string) {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "queued" || status === "processing") return "primary";
  return "neutral";
}

export function TaskReviewSubmissionDetail({
  submissionId,
  backHref,
  integrityHref,
}: TaskReviewSubmissionDetailProps) {
  const [detail, setDetail] = useState<DosenTaskSubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetail(isSilent = false) {
      if (!isSilent) {
        setLoadingDetail(true);
        setDetailError("");
      }

      try {
        const response = await getDosenTaskSubmissionDetail(submissionId);
        if (cancelled) return;

        setDetail(response);
        if (!isSilent) {
          setScoreInput(response.score !== null ? String(response.score) : "");
          setFeedback(response.teacherFeedback ?? "");
        }
      } catch (error: unknown) {
        if (cancelled) return;
        if (!isSilent) {
          setDetail(null);
          setDetailError(error instanceof Error ? error.message : "Gagal memuat detail review tugas.");
        }
      } finally {
        if (!cancelled && !isSilent) setLoadingDetail(false);
      }
    }

    void loadDetail(false);

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  useEffect(() => {
    if (!detail) return undefined;

    const currentStatus = detail.originalityCheck.status;
    if (currentStatus !== "queued" && currentStatus !== "processing") {
      return undefined;
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await getDosenTaskSubmissionDetail(submissionId);
        setDetail(response);
      } catch {
        // Polling bersifat non-blocking, error detail utama tetap dipertahankan.
      }
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [submissionId, detail?.originalityCheck.status]);

  const previewScore = useMemo(() => {
    if (scoreInput.trim() === "") return null;

    const numericValue = Number(scoreInput);
    if (!Number.isFinite(numericValue)) return null;

    return Math.max(0, Math.min(100, Math.round(numericValue)));
  }, [scoreInput]);

  function handleScoreChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly === "") {
      setScoreInput("");
      return;
    }

    const normalized = digitsOnly.slice(0, 3);
    const nextValue = Number(normalized);
    setScoreInput(String(Math.min(100, nextValue)));
  }

  async function handleAction(action: "draft" | "revision" | "publish") {
    if (!detail) return;
    if (previewScore === null) {
      setNotice("Nilai wajib diisi terlebih dahulu.");
      return;
    }

    setSaving(true);
    setNotice("");
    try {
      const updated = await gradeDosenTaskSubmission(submissionId, {
        score: previewScore,
        teacherFeedback: feedback,
        action,
      });

      setDetail(updated);
      setScoreInput(updated.score !== null ? String(updated.score) : "");
      setFeedback(updated.teacherFeedback ?? "");

      if (action === "draft") setNotice("Draft penilaian disimpan.");
      if (action === "revision") setNotice("Permintaan revisi dikirim ke mahasiswa.");
      if (action === "publish") setNotice("Nilai tugas berhasil dipublish.");
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan aksi review.");
    } finally {
      setSaving(false);
    }
  }

  const noticeIsSuccess = [
    "Draft penilaian disimpan.",
    "Permintaan revisi dikirim ke mahasiswa.",
    "Nilai tugas berhasil dipublish.",
  ].includes(notice);

  return (
    <ReviewWorkspace>
      <ReviewFlowHeader
        backHref={backHref}
        backLabel="Kembali ke pengumpulan"
        title="Detail Submission Tugas"
        description="Periksa submission mahasiswa secara fokus lalu beri nilai akhir dari 0 sampai 100."
      />

      <section className="overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white">
        {loadingDetail ? (
          <div className="flex min-h-[320px] items-center justify-center bg-[#fafafa] px-6 py-12 text-center">
            <p className="text-[13px] text-slate-500">Memuat detail submission tugas...</p>
          </div>
        ) : detailError ? (
          <div className="flex min-h-[320px] items-center justify-center bg-red-50 px-6 py-12 text-center">
            <p className="text-[13px] text-red-700">{detailError}</p>
          </div>
        ) : detail ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {notice ? (
              <p
                className={`border-b px-5 py-3 text-[13px] font-semibold sm:px-6 ${
                  noticeIsSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                role="status"
              >
                {notice}
              </p>
            ) : null}

            <div className="border-b border-[#eeeeee] px-5 py-6 sm:px-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                    Mahasiswa
                  </p>
                  <p className="mt-2 text-[21px] font-semibold tracking-[-0.035em] text-slate-950">
                    {detail.studentName}
                  </p>
                  <p className="mt-2 text-[13px] text-slate-600">{detail.assignmentTitle}</p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {detail.className} <span aria-hidden="true">&middot;</span> {detail.courseTitle}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Total Skor
                  </p>
                  <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-slate-950">
                    {previewScore ?? detail.score ?? "-"}/100
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-8">
              <section>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Submission Mahasiswa
                </p>
                <div className="mt-4 divide-y divide-[#eeeeee] border-y border-[#eeeeee]">
                  {detail.submissionLink ? (
                    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
                      <p className="truncate pr-3 text-[13px] text-slate-700">{detail.submissionLink}</p>
                      <a
                        href={detail.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white text-slate-700 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                        aria-label="Buka submission link"
                      >
                        <ArrowUpRightIcon className="h-4 w-4" />
                      </a>
                    </div>
                  ) : null}

                  {detail.submissionFile ? (
                    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
                      <p className="truncate pr-3 text-[13px] text-slate-700">{detail.submissionFile.fileName}</p>
                      <a
                        href={detail.submissionFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white text-slate-700 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                        aria-label="Buka file submission"
                      >
                        <FileCheckIcon className="h-4 w-4" />
                      </a>
                    </div>
                  ) : null}

                  {!detail.submissionLink && !detail.submissionFile ? (
                    <p className="text-[13px] text-slate-500">Tidak ada submission dari mahasiswa.</p>
                  ) : null}
                </div>
              </section>

              <section className="border-t border-[#eeeeee] pt-7">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pemeriksaan Orisinalitas
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={getTaskReviewTone(detail)}>{getTaskReviewLabel(detail)}</StatusBadge>
                      <StatusBadge tone={getOriginalityTone(detail.originalityCheck.status)}>
                        {getOriginalityLabel(detail.originalityCheck.status)}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 max-w-md text-[12px] leading-5 text-slate-500">
                      Hasil ini adalah indikator risiko untuk review manual dosen.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
                      {detail.originalityCheck.maxSimilarity.toFixed(1)}%
                    </p>
                    {integrityHref && detail.originalityCheck.status === "completed" ? (
                      <Link
                        to={integrityHref}
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[10px] border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                      >
                        Integrity Check
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
              </div>

              <aside className="border-t border-[#eeeeee] pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <label className="block">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Nilai Akhir
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={scoreInput}
                    onChange={(event) => handleScoreChange(event.target.value)}
                    className="h-11 w-24 rounded-[10px] border border-[#dedede] bg-white px-3 text-center text-[16px] font-semibold text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-red-100"
                    placeholder="Nilai"
                    aria-label="Nilai akhir tugas"
                  />
                  <p className="text-[13px] text-slate-500">Masukkan nilai langsung dari 0 sampai 100.</p>
                </div>
              </label>

              <label className="mt-6 block">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Feedback Dosen
                </span>
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="mt-3 min-h-36 w-full resize-y rounded-[10px] border border-[#dedede] bg-white p-3 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-red-100"
                  placeholder="Berikan catatan, masukan, atau alasan mengapa mahasiswa perlu melakukan revisi..."
                />
              </label>

            <div className="mt-7 border-t border-[#eeeeee] pt-6">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleAction("draft")}
                  disabled={saving}
                  className="min-h-11 cursor-pointer rounded-[10px] border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("revision")}
                  disabled={saving}
                  className="min-h-11 cursor-pointer rounded-[10px] border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Minta Revisi
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleAction("publish")}
                disabled={saving}
                className="mt-3 min-h-11 w-full cursor-pointer rounded-[10px] bg-[var(--color-primary)] px-4 text-[13px] font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Publish Nilai"}
              </button>
            </div>
              </aside>
            </div>
          </div>
        ) : null}
      </section>
    </ReviewWorkspace>
  );
}
