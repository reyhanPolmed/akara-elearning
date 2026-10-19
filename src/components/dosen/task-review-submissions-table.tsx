import { Link } from "react-router-dom";

import { StatusBadge } from "../status-badge";
import {
  formatTaskSubmittedAt,
  getTaskReviewLabel,
  getTaskReviewTone,
  type ReviewTaskSubmissionRow,
} from "../../lib/dosen-review-flow";
import { cn } from "../../lib/utils";

type TaskReviewSubmissionsTableProps = {
  className: string;
  subjectName: string;
  taskTitle: string;
  submissions: ReviewTaskSubmissionRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  buildDetailHref: (submissionId: string) => string;
  buildIntegrityHref?: (submissionId: string) => string;
};

function getOriginalityLabel(status: string) {
  switch (status) {
    case "queued":
      return "Antrean";
    case "processing":
      return "Diproses";
    case "completed":
      return "Selesai";
    case "failed":
      return "Gagal";
    default:
      return "Belum dicek";
  }
}

function getOriginalityTone(status: string) {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "queued" || status === "processing") return "primary";
  return "neutral";
}

function formatSimilarityPercentage(value: number) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${Math.round(normalizedValue)}%`;
}

export function TaskReviewSubmissionsTable({
  className,
  subjectName,
  taskTitle,
  submissions,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  buildDetailHref,
  buildIntegrityHref,
}: TaskReviewSubmissionsTableProps) {
  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * 8 + 1;
  const rangeEnd = Math.min(currentPage * 8, totalCount);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[#eeeeee] px-5 py-5 sm:px-6">
        <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">{taskTitle}</p>
        <p className="mt-2 text-[13px] text-slate-500">
          Kelas {className} <span aria-hidden="true">&middot;</span> {subjectName}{" "}
          <span aria-hidden="true">&middot;</span> {totalCount} pengumpulan
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="px-5 py-4">Mahasiswa</th>
              <th className="px-4 py-4">Dikumpulkan</th>
              <th className="px-4 py-4">Skor</th>
              <th className="px-4 py-4">Status review</th>
              <th className="px-4 py-4">Originalitas</th>
              <th className="px-4 py-4 text-center">Kemiripan</th>
              <th className="px-5 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eeeeee]">
            {submissions.map((submission) => (
              <tr key={submission.id} className="transition-colors hover:bg-[#fafafa]">
                <td className="px-5 py-4 text-[13px] font-semibold text-slate-950">
                  {submission.studentName}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-[12px] text-slate-500">
                  {formatTaskSubmittedAt(submission.submittedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-[13px] font-semibold text-slate-950">
                  {submission.score !== null ? `${submission.score}/100` : "-"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={getTaskReviewTone(submission)}>
                    {getTaskReviewLabel(submission)}
                  </StatusBadge>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={getOriginalityTone(submission.originalityCheck.status)}>
                    {getOriginalityLabel(submission.originalityCheck.status)}
                  </StatusBadge>
                </td>
                <td className="px-4 py-4 text-center text-[13px] font-semibold text-slate-950">
                  {submission.originalityCheck.status === "completed"
                    ? formatSimilarityPercentage(submission.originalityCheck.maxSimilarity)
                    : "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Link
                      to={buildDetailHref(submission.id)}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] border border-slate-950 bg-slate-950 px-3 text-[12px] font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                    >
                      Review
                    </Link>
                    {buildIntegrityHref && submission.originalityCheck.status === "completed" ? (
                      <Link
                        to={buildIntegrityHref(submission.id)}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                      >
                        Integrity Check
                      </Link>
                    ) : buildIntegrityHref ? (
                      <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-3 text-[12px] font-medium text-slate-500">
                        {getOriginalityLabel(submission.originalityCheck.status)}
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eeeeee] px-5 py-4 sm:px-6">
        <p className="text-[12px] text-slate-500">
          {rangeStart}-{rangeEnd} dari {totalCount} pengumpulan
        </p>
        <nav className="flex flex-wrap gap-2" aria-label="Navigasi halaman pengumpulan">
          {paginationItems.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? "page" : undefined}
              aria-label={`Buka halaman ${page}`}
              className={cn(
                "min-h-10 min-w-10 cursor-pointer rounded-[10px] px-3 text-[12px] font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-slate-900/10",
                currentPage === page
                  ? "bg-slate-950 text-white"
                  : "border border-[#e5e5e5] bg-white text-slate-600 hover:bg-[#f5f5f5]"
              )}
            >
              {page}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
