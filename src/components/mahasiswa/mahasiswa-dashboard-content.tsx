import { Link } from "react-router-dom";

import type { DashboardAgendaItem, MahasiswaDashboard } from "../../lib/dashboard-api";
import { cn } from "../../lib/utils";
import { DashboardPanel } from "../dashboard/dashboard-panel";
import { ProgressIndicator } from "../dashboard/progress-indicator";

type MahasiswaDashboardContentProps = {
  dashboard: MahasiswaDashboard;
  fallbackName?: string;
};

type AgendaViewItem = DashboardAgendaItem & {
  label: "Kuis" | "Tugas";
};

type SummaryMetricProps = {
  helper: string;
  index: number;
  label: string;
  value: number | string;
};

const editorialPanelClassName =
  "!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none";

function getFirstName(fullName: string) {
  return fullName.split(" ").filter(Boolean)[0] ?? "Mahasiswa";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildAgendaItems(input: {
  upcomingQuizzes: DashboardAgendaItem[];
  upcomingTasks: DashboardAgendaItem[];
}) {
  return [
    ...input.upcomingQuizzes.map((item) => ({ ...item, label: "Kuis" as const })),
    ...input.upcomingTasks.map((item) => ({ ...item, label: "Tugas" as const })),
  ]
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
    .slice(0, 5);
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

export function MahasiswaDashboardContent({
  dashboard,
  fallbackName,
}: MahasiswaDashboardContentProps) {
  const firstName = getFirstName(dashboard.user.fullName || fallbackName || "Mahasiswa");
  const agendaItems: AgendaViewItem[] = buildAgendaItems(dashboard);
  const summaryMetrics = [
    ...dashboard.metrics.slice(0, 3),
    {
      label: "Progress mingguan",
      value: `${dashboard.user.weeklyProgress}%`,
      helper: "Aktivitas minggu ini",
    },
  ];
  const continueHref = dashboard.modules[0]
    ? `/mahasiswa/modul/${dashboard.modules[0].id}`
    : "/mahasiswa/modul";

  return (
    <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
      <div className="mx-auto max-w-[1260px] space-y-12">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-[var(--color-primary)]">Dashboard mahasiswa</p>
            <h1 className="mt-4 text-[30px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#0a0a0a] sm:text-[38px]">
              Selamat datang, {firstName}.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              Lihat progres belajar dan pekerjaan terdekat tanpa kehilangan fokus pada mata kuliah utama Anda.
            </p>
            <p className="mt-5 text-xs font-medium text-[#737373]">
              {dashboard.user.className || "Kelas belum tersedia"}
              <span aria-hidden="true" className="mx-2 text-slate-300">/</span>
              {dashboard.user.department || "Departemen belum tersedia"}
            </p>
          </div>

          <Link
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-22px_rgba(180,35,24,0.7)] transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
            to={continueHref}
          >
            Lanjutkan belajar
          </Link>
        </header>

        <section aria-labelledby="student-summary-heading" className="border-y border-[#e5e5e5] py-8">
          <h2 className="eyebrow" id="student-summary-heading">Ringkasan semester</h2>
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4 xl:gap-x-8">
            {summaryMetrics.map((metric, index) => (
              <SummaryMetric key={metric.label} index={index} {...metric} />
            ))}
          </dl>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
          <DashboardPanel
            action={
              <Link
                className="text-sm font-semibold text-slate-700 underline decoration-[#d4d4d4] underline-offset-4 transition hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                to="/mahasiswa/modul"
              >
                Lihat semua
              </Link>
            }
            className={editorialPanelClassName}
            description={`${dashboard.modules.length} mata kuliah terhubung dengan kelas Anda.`}
            padded={false}
            title="Mata kuliah aktif"
          >
            {dashboard.modules.length === 0 ? (
              <p className="px-6 py-12 text-sm leading-6 text-[#737373]">
                Belum ada mata kuliah aktif untuk kelas Anda.
              </p>
            ) : (
              <div className="divide-y divide-[#e5e5e5]">
                {dashboard.modules.slice(0, 4).map((module) => (
                  <Link
                    className="group block px-6 py-6 transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-slate-100"
                    key={module.id}
                    to={`/mahasiswa/modul/${module.id}`}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-[#0a0a0a] group-hover:text-slate-700">
                          {module.title}
                        </h3>
                        <p className="mt-1 truncate text-xs text-[#737373]">
                          {module.dosenName}
                          <span aria-hidden="true" className="mx-2 text-slate-300">/</span>
                          {module.department}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#171717]">
                        {module.completionRate}%
                      </p>
                    </div>

                    <div className="mt-4">
                      <ProgressIndicator label="Progress mata kuliah" value={module.completionRate} />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-xs leading-5 text-[#737373] sm:flex-row sm:items-center sm:justify-between">
                      <p className="line-clamp-1">Berikutnya: {module.nextItemTitle}</p>
                      <span className="shrink-0 font-semibold text-slate-700 group-hover:text-[#0a0a0a]">
                        Buka mata kuliah &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            action={
              <Link
                className="text-sm font-semibold text-slate-700 underline decoration-[#d4d4d4] underline-offset-4 transition hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                to="/mahasiswa/tugas"
              >
                Lihat tugas
              </Link>
            }
            className={editorialPanelClassName}
            description="Kuis dan tugas yang perlu diprioritaskan."
            padded={false}
            title="Agenda terdekat"
          >
            {agendaItems.length === 0 ? (
              <p className="px-6 py-12 text-sm leading-6 text-[#737373]">
                Belum ada kuis atau tugas yang mendekati deadline.
              </p>
            ) : (
              <div className="divide-y divide-[#e5e5e5] px-6">
                {agendaItems.map((item) => (
                  <Link
                    className="group block py-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                    key={`${item.type}-${item.id}`}
                    to={item.href || (item.type === "quiz" ? "/mahasiswa/modul" : "/mahasiswa/tugas")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-strong)]">
                          {item.label}
                        </p>
                        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#0a0a0a] group-hover:text-slate-700">
                          {item.title}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-[#737373]">{item.moduleTitle}</p>
                      </div>
                      <span className="shrink-0 text-slate-400 group-hover:text-slate-700" aria-hidden="true">
                        &rarr;
                      </span>
                    </div>
                    <time className="mt-3 block text-xs font-medium text-slate-600" dateTime={item.dueAt}>
                      Deadline {formatDateTime(item.dueAt)}
                    </time>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>
        </div>

        <section aria-labelledby="student-schedule-heading" className="border-y border-[#e5e5e5] py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Jadwal</p>
              <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]" id="student-schedule-heading">
                Jadwal mata kuliah
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#737373]">
                Pertemuan terjadwal yang perlu Anda siapkan.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-slate-700 underline decoration-[#d4d4d4] underline-offset-4 transition hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
              to="/mahasiswa/jadwal"
            >
              Buka jadwal lengkap
            </Link>
          </div>

          {dashboard.scheduleItems.length === 0 ? (
            <p className="mt-8 border-t border-[#e5e5e5] pt-8 text-sm leading-6 text-[#737373]">
              Jadwal belum tersedia dari backend.
            </p>
          ) : (
            <div className="mt-8 divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
              {dashboard.scheduleItems.slice(0, 4).map((item) => (
                <article
                  className="grid gap-3 py-5 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center"
                  key={item.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">{item.dayName}</p>
                    <p className="mt-1 text-xs text-[#737373]">{item.timeRange}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.courseTitle}</p>
                    <p className="mt-1 truncate text-xs text-[#737373]">{item.dosenName}</p>
                  </div>
                  <Link
                    className="w-fit text-xs font-semibold text-slate-700 underline decoration-[#d4d4d4] underline-offset-4 transition hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                    to="/mahasiswa/jadwal"
                  >
                    Lihat detail
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
