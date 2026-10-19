import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import {
  LearningPageHeader,
  LearningWorkspace,
} from "../components/mahasiswa/learning-workspace";
import { getMahasiswaDashboard } from "../lib/dashboard-api";
import { useApiResource } from "../lib/use-api-resource";

export function MahasiswaSchedulePage() {
  const { data: dashboard, error, loading, reload } = useApiResource(getMahasiswaDashboard);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat jadwal" />
      </AppShell>
    );
  }

  if (error || !dashboard) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data jadwal kosong."} onRetry={reload} />
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
                {dashboard.scheduleItems.length}
              </p>
              <p className="mt-2 text-xs text-[#737373]">pertemuan terjadwal</p>
            </div>
          }
          description="Lihat waktu pertemuan, mata kuliah, dan dosen dalam susunan agenda yang ringkas."
          eyebrow="Jadwal mahasiswa"
          title="Jadwal mata kuliah"
        />

        <section aria-labelledby="schedule-list-heading">
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]" id="schedule-list-heading">
              Agenda kelas
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#737373]">
              Jadwal mengikuti relasi kelas dan mata kuliah yang tersedia pada sistem.
            </p>
          </div>

          {dashboard.scheduleItems.length === 0 ? (
            <div className="border-y border-dashed border-[#d4d4d4] py-12 text-sm text-[#737373]">
              Jadwal belum tersedia.
            </div>
          ) : (
            <ol className="divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
              {dashboard.scheduleItems.map((item, index) => (
                <li
                  className="grid gap-4 py-6 sm:px-4 md:grid-cols-[52px_150px_minmax(0,1fr)_minmax(180px,0.55fr)] md:items-center"
                  key={item.id}
                >
                  <span className="text-[11px] font-semibold text-[#a3a3a3]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">{item.dayName}</p>
                    <p className="mt-1 text-xs text-[#737373]">{item.timeRange}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#0a0a0a]">{item.courseTitle}</p>
                    <p className="mt-1 text-xs text-[#737373]">Mata kuliah terjadwal</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">Dosen</p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-700">{item.dosenName}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </LearningWorkspace>
    </AppShell>
  );
}
