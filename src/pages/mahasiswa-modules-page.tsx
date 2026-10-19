import { Link } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { ProgressIndicator } from "../components/dashboard/progress-indicator";
import {
  LearningPageHeader,
  LearningWorkspace,
} from "../components/mahasiswa/learning-workspace";
import { listMahasiswaModules } from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

export function MahasiswaModulesPage() {
  const { data: modules, error, loading, reload } = useApiResource(listMahasiswaModules);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat mata kuliah" />
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
      <LearningWorkspace>
        <LearningPageHeader
          aside={
            <div className="lg:text-right">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#0a0a0a]">
                {modules.length}
              </p>
              <p className="mt-2 text-xs text-[#737373]">mata kuliah aktif</p>
            </div>
          }
          description="Pilih mata kuliah untuk melanjutkan materi, kuis, atau tugas sesuai urutan pembelajaran."
          eyebrow="Mata kuliah saya"
          title="Ruang belajar aktif"
        />

        <section aria-labelledby="course-list-heading">
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]" id="course-list-heading">
              Daftar mata kuliah
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#737373]">
              Progress dan item berikutnya ditampilkan tanpa memenuhi halaman dengan card tambahan.
            </p>
          </div>

          {modules.length === 0 ? (
            <div className="border-y border-dashed border-[#d4d4d4] py-12 text-sm text-[#737373]">
              Belum ada mata kuliah aktif.
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
              {modules.map((module) => (
                <Link
                  className="group grid gap-5 py-7 transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 sm:px-4 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-center"
                  key={module.id}
                  to={`/mahasiswa/modul/${module.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-strong)]">
                      {module.bannerLabel ?? module.department}
                    </p>
                    <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.035em] text-[#0a0a0a] group-hover:text-slate-700">
                      {module.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#737373]">
                      {module.dosenName}
                      <span aria-hidden="true" className="mx-2 text-[#d4d4d4]">/</span>
                      {module.totalItems} item belajar
                    </p>
                    <p className="mt-3 line-clamp-1 text-xs text-[#737373]">
                      Berikutnya: {module.nextItemTitle}
                    </p>
                  </div>

                  <ProgressIndicator label="Progress mata kuliah" value={module.completionRate} />

                  <span className="w-fit shrink-0 text-sm font-semibold text-slate-700 group-hover:text-[#0a0a0a]">
                    Buka mata kuliah &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </LearningWorkspace>
    </AppShell>
  );
}
