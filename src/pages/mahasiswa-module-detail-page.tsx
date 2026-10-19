import { Link, useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { ProgressIndicator } from "../components/dashboard/progress-indicator";
import { getLearningItemHref } from "../components/learning/learning-outline";
import {
  LearningBreadcrumb,
  LearningPageHeader,
  LearningWorkspace,
  learningPanelClassName,
} from "../components/mahasiswa/learning-workspace";
import { StatusBadge } from "../components/status-badge";
import { cn } from "../lib/utils";
import { getMahasiswaModule, type LearningSidebarItem } from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

const typeMeta = {
  lesson: "Materi",
  quiz: "Kuis",
  task: "Tugas",
} satisfies Record<LearningSidebarItem["type"], string>;

function getItemStatus(item: LearningSidebarItem) {
  if (item.isLocked) return "Terkunci";
  if (item.isCompleted) return "Selesai";
  return "Tersedia";
}

function getItemTone(item: LearningSidebarItem) {
  if (item.isLocked) return "warning";
  if (item.isCompleted) return "success";
  return "neutral";
}

export function MahasiswaModuleDetailPage() {
  const { moduleId } = useParams();
  const { data, error, loading, reload } = useApiResource(
    () => getMahasiswaModule(moduleId ?? ""),
    [moduleId]
  );

  if (!moduleId) {
    return (
      <AppShell>
        <DashboardErrorState message="ID mata kuliah tidak valid." onRetry={reload} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat detail mata kuliah" />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Detail mata kuliah kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <LearningWorkspace>
        <LearningBreadcrumb current={data.title} />

        <LearningPageHeader
          aside={
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                  Progress
                </p>
                <p className="text-[28px] font-semibold tracking-[-0.04em] text-[#0a0a0a]">
                  {data.completionRate ?? 0}%
                </p>
              </div>
              <div className="mt-3">
                <ProgressIndicator label="Mata kuliah" value={data.completionRate ?? 0} />
              </div>
            </div>
          }
          description={data.description || `Mata kuliah bersama ${data.dosenName}.`}
          eyebrow={data.department}
          meta={
            <>
              <span>{data.totalItems} item belajar</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>Dosen {data.dosenName}</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>Berikutnya: {data.nextItemTitle}</span>
            </>
          }
          title={data.title}
        />

        <section aria-labelledby="course-content-heading">
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]" id="course-content-heading">
              Susunan pembelajaran
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373]">
              Buka materi, kuis, dan tugas sesuai urutan pada setiap bab.
            </p>
          </div>

          {data.sections.length === 0 ? (
            <div className="border-y border-dashed border-[#d4d4d4] py-12 text-sm text-[#737373]">
              Belum ada bab untuk mata kuliah ini.
            </div>
          ) : (
            <div className="space-y-6">
              {data.sections.map((section, sectionIndex) => (
                <section className={learningPanelClassName} key={section.id}>
                  <header className="border-b border-[#eeeeee] px-5 py-5 sm:px-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                      Bab {sectionIndex + 1}
                    </p>
                    <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
                      {section.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#737373]">
                      {section.description || "Bab pembelajaran dari dosen."}
                    </p>
                  </header>

                  {section.items.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#737373] sm:px-6">
                      Bab ini belum memiliki item belajar.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#eeeeee]">
                      {section.items.map((item, itemIndex) => (
                        <LearningItemRow
                          index={itemIndex}
                          item={item}
                          key={`${item.type}-${item.id}`}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </section>
      </LearningWorkspace>
    </AppShell>
  );
}

function LearningItemRow({ item, index }: { item: LearningSidebarItem; index: number }) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
          {typeMeta[item.type]} {index + 1}
        </p>
        <h4 className="mt-2 text-[15px] font-semibold leading-6 text-[#0a0a0a]">
          {item.title}
        </h4>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge tone={getItemTone(item)}>{getItemStatus(item)}</StatusBadge>
        {!item.isLocked ? <span aria-hidden="true" className="text-slate-400">&rarr;</span> : null}
      </div>
    </>
  );
  const className = cn(
    "grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6",
    item.isLocked
      ? "cursor-not-allowed bg-[#fafafa] opacity-70"
      : "transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-slate-100"
  );

  if (item.isLocked) {
    return <div aria-disabled="true" className={className}>{content}</div>;
  }

  return (
    <Link className={className} to={getLearningItemHref(item)}>
      {content}
    </Link>
  );
}
