import { Link } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { ProgressIndicator } from "../components/dashboard/progress-indicator";
import { StatusBadge } from "../components/status-badge";
import type { DosenModuleSummary } from "../lib/learning-api";
import { listDosenModules } from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

function DosenModuleCard({ module }: { module: DosenModuleSummary }) {
  const contentSummary = [
    `${module.chapters} bab`,
    `${module.lessons} materi`,
    `${module.quizzes} kuis`,
    `${module.tasks} tugas`,
  ];

  return (
    <article className="flex h-full flex-col rounded-[12px] border border-[#e5e5e5] bg-white p-5 transition-colors hover:border-slate-300 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {module.department}
          </p>
          <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.035em] text-slate-950">
            {module.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{module.gradeLevel}</p>
        </div>
        <StatusBadge tone={module.status === "published" ? "success" : "neutral"}>
          {module.status === "published" ? "Aktif" : "Draft"}
        </StatusBadge>
      </div>

      <div className="mt-7 border-y border-[#eeeeee] py-5">
        <ProgressIndicator label="Kelengkapan konten" value={module.completionRate} />
        <p className="mt-4 text-[13px] leading-6 text-slate-500">
          {contentSummary.join("  ·  ")}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-slate-500">
          <span className="font-semibold text-slate-900">{module.draftItems}</span> item masih draft
        </p>
        <Link
          to={`/dosen/mata-kuliah/${module.id}/builder`}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] border border-slate-900 bg-slate-950 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
        >
          Buka Mata Kuliah
        </Link>
      </div>
    </article>
  );
}

export function DosenModulesPage() {
  const { data: modules, error, loading, reload } = useApiResource(listDosenModules);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat mata kuliah dosen" />
      </AppShell>
    );
  }

  if (error || !modules) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data mata kuliah kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
        <div className="mx-auto max-w-[1260px] space-y-12">
          <header className="flex flex-col gap-7 border-b border-[#e5e5e5] pb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
                Workspace Dosen
              </p>
              <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[40px]">
                Mata Kuliah
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">
                Kelola susunan bab, materi, kuis, dan tugas dari satu ruang kerja yang ringkas.
              </p>
            </div>
            <p className="shrink-0 text-sm text-slate-500">
              <span className="mr-2 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
                {modules.length}
              </span>
              mata kuliah aktif
            </p>
          </header>

          <section aria-labelledby="daftar-mata-kuliah">
            <div className="mb-6">
              <h2
                id="daftar-mata-kuliah"
                className="text-[22px] font-semibold tracking-[-0.035em] text-slate-950"
              >
                Daftar Mata Kuliah
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Pilih mata kuliah untuk membuka detail dan mengelola kontennya.
              </p>
            </div>

            {modules.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-slate-950">Belum ada mata kuliah.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Data mata kuliah akan muncul setelah dosen terhubung ke kelas.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {modules.map((module) => (
                  <DosenModuleCard key={module.id} module={module} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
