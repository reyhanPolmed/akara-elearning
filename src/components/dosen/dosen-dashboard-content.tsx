import { Link } from "react-router-dom";

import type { DosenDashboard } from "../../lib/dashboard-api";
import { cn } from "../../lib/utils";
import { DashboardPanel } from "../dashboard/dashboard-panel";
import { ProgressIndicator } from "../dashboard/progress-indicator";
import { StatusBadge } from "../status-badge";

type DosenDashboardContentProps = { dashboard: DosenDashboard };

type SummaryMetricProps = {
  helper: string;
  index: number;
  label: string;
  value: number;
};

const editorialPanelClassName =
  "!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none";

function getSubmissionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "Perlu review",
    graded: "Dinilai",
    revised: "Revisi",
    retake: "Dikerjakan ulang",
  };
  return labels[status] ?? status;
}

function getStatusTone(status: string) {
  if (["graded", "published", "completed"].includes(status)) return "success" as const;
  if (["submitted", "perlu-review"].includes(status)) return "review" as const;
  if (["revised", "retake", "revision"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

function getModuleStatusLabel(status: string) {
  return status === "published" ? "Aktif" : "Draft";
}

function getSimilarityLabel(status: string, percent: number) {
  if (status === "completed") return `${percent}%`;
  if (status === "failed") return "Gagal";
  if (status === "processing" || status === "queued") return "Diproses";
  return "Belum dicek";
}

function SummaryMetric({ helper, index, label, value }: SummaryMetricProps) {
  return (
    <div
      className={cn(
        "min-w-0",
        index > 0 && "xl:border-l xl:border-[#e5e5e5] xl:pl-8"
      )}
    >
      <dt className="text-[11px] font-medium uppercase leading-5 tracking-[0.12em] text-[#737373]">
        {label}
      </dt>
      <dd className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#0a0a0a]">
        {value}
      </dd>
      <p className="mt-2 text-xs leading-5 text-[#737373]">{helper}</p>
    </div>
  );
}

export function DosenDashboardContent({ dashboard }: DosenDashboardContentProps) {
  const summaryMetrics = [
    { label: "Mata kuliah aktif", value: dashboard.kpi.activeModules, helper: "Sedang diampu" },
    { label: "Kelas aktif", value: dashboard.kpi.activeClasses, helper: "Semester berjalan" },
    { label: "Perlu review", value: dashboard.kpi.needReview, helper: "Submission baru" },
    { label: "Draft", value: dashboard.kpi.draftItems, helper: "Belum dipublikasi" },
    { label: "Menunggu revisi", value: dashboard.kpi.pendingRevision, helper: "Perlu tindak lanjut" },
  ];
  const reviewDescription = dashboard.kpi.needReview
    ? `${dashboard.kpi.needReview} submission menunggu tindak lanjut.`
    : "Tidak ada submission baru yang perlu ditinjau.";

  return (
    <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
      <div className="mx-auto max-w-[1260px] space-y-12">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow text-[var(--color-primary)]">Dashboard dosen</p>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#0a0a0a] sm:text-[38px]">
            Selamat datang, {dashboard.dosen.name}.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
            Pantau pekerjaan yang membutuhkan perhatian dan lanjutkan aktivitas mengajar Anda.
          </p>
          <p className="mt-5 text-xs font-medium text-[#737373]">
            {dashboard.dosen.department || "Departemen belum tersedia"}
            <span aria-hidden="true" className="mx-2 text-slate-300">/</span>
            NIP {dashboard.dosen.nip || "-"}
          </p>
        </div>

        <Link
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-22px_rgba(180,35,24,0.7)] transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
          to="/dosen/review-tugas"
        >
          {dashboard.kpi.needReview ? "Mulai review tugas" : "Buka review tugas"}
        </Link>
      </header>

      <section aria-labelledby="summary-heading" className="border-y border-[#e5e5e5] py-8">
        <h2 className="eyebrow" id="summary-heading">Ringkasan semester</h2>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 xl:grid-cols-5 xl:gap-x-8">
          {summaryMetrics.map((metric, index) => (
            <SummaryMetric key={metric.label} index={index} {...metric} />
          ))}
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <DashboardPanel
          action={
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f5f5f5] hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
              to="/dosen/review-tugas"
            >
              Lihat antrean
            </Link>
          }
          className={editorialPanelClassName}
          description={reviewDescription}
          padded={false}
          title="Submission terbaru"
        >
          {dashboard.recentSubmissions.length === 0 ? (
            <p className="px-6 py-12 text-sm leading-6 text-[#737373]">Submission terbaru akan muncul di sini.</p>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {dashboard.recentSubmissions.slice(0, 5).map((submission) => (
                <article
                  className="grid gap-4 px-6 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={submission.id}
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#0a0a0a]">{submission.mahasiswaName}</h3>
                    <p className="mt-1 truncate text-sm text-slate-600">{submission.assignmentTitle}</p>
                    <p className="mt-1 truncate text-xs text-[#737373]">
                      {submission.courseTitle} · {submission.className}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">Kemiripan</p>
                      <p className="mt-1 text-sm font-semibold text-[#171717]">
                        {getSimilarityLabel(submission.similarityStatus, submission.similarityPercent)}
                      </p>
                    </div>
                    <StatusBadge tone={getStatusTone(submission.status)}>
                      {getSubmissionStatusLabel(submission.status)}
                    </StatusBadge>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          action={
            <Link
              className="text-sm font-semibold text-slate-700 underline decoration-[#d4d4d4] underline-offset-4 transition hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
              to="/dosen/mata-kuliah"
            >
              Kelola semua
            </Link>
          }
          className={editorialPanelClassName}
          description={`${dashboard.modules.length} mata kuliah terhubung dengan akun Anda.`}
          padded={false}
          title="Mata kuliah Anda"
        >
          {dashboard.modules.length === 0 ? (
            <p className="px-6 py-12 text-sm leading-6 text-[#737373]">Belum ada mata kuliah yang terhubung.</p>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {dashboard.modules.slice(0, 4).map((module) => (
                <Link
                  className="group block px-6 py-6 transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-slate-100"
                  key={module.id}
                  to={`/dosen/mata-kuliah/${module.id}/builder`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#0a0a0a] group-hover:text-slate-700">{module.title}</h3>
                      <p className="mt-1 truncate text-xs text-[#737373]">{module.department} · {module.gradeLevel}</p>
                    </div>
                    <StatusBadge tone={getStatusTone(module.status)}>{getModuleStatusLabel(module.status)}</StatusBadge>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-[#737373]">
                    {module.chapters} bab · {module.lessons} materi · {module.quizzes} kuis · {module.tasks} tugas
                  </p>
                  <div className="mt-4">
                    <ProgressIndicator label="Progress mahasiswa" value={module.completionRate} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>
      </div>
    </div>
  );
}
