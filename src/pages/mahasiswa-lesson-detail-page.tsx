import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { ProgressIndicator } from "../components/dashboard/progress-indicator";
import { LearningOutline } from "../components/learning/learning-outline";
import {
  LearningBreadcrumb,
  LearningPageHeader,
  LearningWorkspace,
  learningPanelClassName,
} from "../components/mahasiswa/learning-workspace";
import { StatusBadge } from "../components/status-badge";
import {
  completeMahasiswaLesson,
  getMahasiswaLesson,
  trackMahasiswaLessonDuration,
  type MahasiswaLessonDetail,
} from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

function isVideoContent(lesson: MahasiswaLessonDetail) {
  return lesson.contentType.includes("video") && lesson.contentUrl;
}

function isPdfContent(lesson: MahasiswaLessonDetail) {
  return lesson.contentUrl.toLowerCase().endsWith(".pdf") || lesson.contentType.includes("pdf");
}

function getProgressValue(lesson: MahasiswaLessonDetail) {
  if (lesson.isCompleted) return 100;
  if (lesson.durationTargetSeconds <= 0) return 0;
  return Math.min(99, Math.round((lesson.trackedSeconds / lesson.durationTargetSeconds) * 100));
}

export function MahasiswaLessonDetailPage() {
  const { lessonId } = useParams();
  const { data: lesson, error, loading, reload } = useApiResource(
    () => getMahasiswaLesson(lessonId ?? ""),
    [lessonId]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lessonId || !lesson || lesson.isCompleted) return;

    const timer = window.setTimeout(() => {
      void trackMahasiswaLessonDuration(lessonId, 30).catch(() => null);
    }, 30_000);

    return () => window.clearTimeout(timer);
  }, [lessonId, lesson]);

  if (!lessonId) {
    return (
      <AppShell>
        <DashboardErrorState message="ID materi tidak valid." onRetry={reload} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat materi" />
      </AppShell>
    );
  }

  if (error || !lesson) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Materi kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  async function handleComplete() {
    if (!lessonId) return;

    setSaving(true);
    try {
      await completeMahasiswaLesson(lessonId);
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <LearningWorkspace wide>
        <LearningBreadcrumb current={lesson.title} href={`/mahasiswa/modul/${lesson.courseId}`} />

        <LearningPageHeader
          description={lesson.excerpt || "Pelajari materi ini lalu tandai selesai setelah kontennya dipahami."}
          eyebrow="Materi"
          meta={
            <StatusBadge tone={lesson.isCompleted ? "success" : "neutral"}>
              {lesson.isCompleted ? "Selesai" : "Sedang dipelajari"}
            </StatusBadge>
          }
          title={lesson.title}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className={learningPanelClassName} aria-label="Konten materi">
            {isVideoContent(lesson) ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-[420px] w-full bg-slate-950 lg:h-[620px]"
                src={lesson.contentUrl}
                title={lesson.title}
              />
            ) : isPdfContent(lesson) ? (
              <iframe
                className="h-[620px] w-full bg-white"
                src={lesson.contentUrl}
                title={lesson.title}
              />
            ) : lesson.contentUrl ? (
              <div className="border-b border-[#e5e5e5] px-6 py-6">
                <a
                  className="inline-flex min-h-11 items-center rounded-[10px] bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                  href={lesson.contentUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Buka konten materi
                </a>
              </div>
            ) : null}

            <article className="px-6 py-8 sm:px-8 sm:py-10">
              <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700">
                {lesson.content || "Konten teks belum tersedia."}
              </p>
            </article>
          </section>

          <aside className="space-y-8">
            <section className={`${learningPanelClassName} p-5 sm:p-6`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                Progress materi
              </p>
              <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">
                Aktivitas belajar
              </h2>
              <div className="mt-6">
                <ProgressIndicator value={getProgressValue(lesson)} />
              </div>
              <button
                className="mt-6 min-h-11 w-full rounded-[10px] bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving || lesson.isCompleted}
                onClick={() => void handleComplete()}
                type="button"
              >
                {lesson.isCompleted ? "Materi sudah selesai" : saving ? "Menyimpan..." : "Tandai selesai"}
              </button>
            </section>

            {lesson.tips.length > 0 ? (
              <section className="border-y border-[#e5e5e5] py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#737373]">Tips belajar</p>
                <ul className="mt-4 divide-y divide-[#eeeeee] text-sm leading-6 text-slate-600">
                  {lesson.tips.map((tip) => (
                    <li className="py-3 first:pt-0 last:pb-0" key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <LearningOutline
              activeItem={{
                id: lesson.id,
                type: "lesson",
              }}
              items={lesson.sidebar}
            />
          </aside>
        </div>
      </LearningWorkspace>
    </AppShell>
  );
}
