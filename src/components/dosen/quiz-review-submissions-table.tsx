import { Link } from "react-router-dom";

import { StatusBadge } from "../status-badge";
import { formatDateTime } from "../../lib/format";
import type { DosenQuizSubmission } from "../../lib/learning-api";

type QuizReviewSubmissionsTableProps = {
  submissions: DosenQuizSubmission[];
  buildDetailHref: (submissionId: string) => string;
};

function getQuizTone(status: string) {
  if (status === "graded") return "success";
  if (status === "retake") return "warning";
  return "neutral";
}

function getQuizLabel(status: string) {
  if (status === "graded") return "Dinilai";
  if (status === "retake") return "Retake";
  if (status === "draft") return "Draft";
  return "Perlu review";
}

export function QuizReviewSubmissionsTable({
  submissions,
  buildDetailHref,
}: QuizReviewSubmissionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <th className="px-5 py-4">Mahasiswa</th>
            <th className="px-4 py-4">Kuis</th>
            <th className="px-4 py-4">Dikumpulkan</th>
            <th className="px-4 py-4 text-right">Skor</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-5 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eeeeee]">
          {submissions.length === 0 ? (
            <tr>
              <td className="px-5 py-12 text-center text-sm text-slate-500" colSpan={6}>
                Belum ada pengumpulan kuis untuk mata kuliah ini.
              </td>
            </tr>
          ) : (
            submissions.map((submission) => (
              <tr key={submission.id} className="transition-colors hover:bg-[#fafafa]">
                <td className="px-5 py-4">
                  <p className="text-[13px] font-semibold text-slate-950">{submission.studentName}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{submission.className}</p>
                </td>
                <td className="px-4 py-4 text-[13px] text-slate-700">{submission.assignmentTitle}</td>
                <td className="whitespace-nowrap px-4 py-4 text-[12px] text-slate-500">
                  {formatDateTime(submission.submittedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-[13px] font-semibold text-slate-950">
                  {submission.score !== null ? `${submission.score}/100` : "-"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={getQuizTone(submission.status)}>
                    {getQuizLabel(submission.status)}
                  </StatusBadge>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-slate-950 bg-slate-950 px-4 text-[12px] font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                    to={buildDetailHref(submission.id)}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
