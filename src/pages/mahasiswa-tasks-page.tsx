import { Link } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import {
  LearningPageHeader,
  LearningWorkspace,
} from "../components/mahasiswa/learning-workspace";
import { StatusBadge } from "../components/status-badge";
import { getMahasiswaDashboard } from "../lib/dashboard-api";
import { formatDateTime } from "../lib/format";
import { useApiResource } from "../lib/use-api-resource";

export function MahasiswaTasksPage() {
  const { data: dashboard, error, loading, reload } = useApiResource(getMahasiswaDashboard);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat tugas mahasiswa" />
      </AppShell>
    );
  }

  if (error || !dashboard) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data tugas kosong."} onRetry={reload} />
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
                {dashboard.upcomingTasks.length}
              </p>
              <p className="mt-2 text-xs text-[#737373]">tugas aktif</p>
            </div>
          }
          description="Pantau deadline dan buka pengumpulan tugas dari satu daftar yang mudah dipindai."
          eyebrow="Tugas mahasiswa"
          title="Daftar pengumpulan"
        />

        <section aria-labelledby="active-tasks-heading">
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]" id="active-tasks-heading">
              Tugas aktif
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#737373]">
              Urutkan perhatian berdasarkan deadline dan status pengerjaan.
            </p>
          </div>

          <div className="overflow-x-auto border-y border-[#e5e5e5]">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                  <th className="px-5 py-4">Tugas</th>
                  <th className="px-5 py-4">Mata kuliah</th>
                  <th className="px-5 py-4">Deadline</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {dashboard.upcomingTasks.length === 0 ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-[#737373]" colSpan={5}>
                      Belum ada tugas aktif.
                    </td>
                  </tr>
                ) : (
                  dashboard.upcomingTasks.map((task) => (
                    <tr className="transition-colors hover:bg-[#fafafa]" key={task.id}>
                      <td className="px-5 py-5 font-semibold text-[#0a0a0a]">{task.title}</td>
                      <td className="px-5 py-5 text-slate-600">{task.moduleTitle}</td>
                      <td className="whitespace-nowrap px-5 py-5 text-slate-600">
                        {formatDateTime(task.dueAt)}
                      </td>
                      <td className="px-5 py-5">
                        <StatusBadge tone={task.status === "revision" ? "warning" : "neutral"}>
                          {task.status === "revision" ? "Revisi" : "Terjadwal"}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <Link
                          className="inline-flex min-h-10 items-center rounded-[10px] bg-[#171717] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                          to={`/mahasiswa/tugas/${task.id}`}
                        >
                          Buka tugas
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </LearningWorkspace>
    </AppShell>
  );
}
