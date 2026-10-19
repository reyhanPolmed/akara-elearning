import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../dashboard/dashboard-state";
import { StatusBadge } from "../status-badge";
import { ReviewFlowHeader, ReviewSection, ReviewWorkspace } from "./review-flow";
import {
  getDosenQuizAttemptDetail,
  gradeDosenQuizAttempt,
  type DosenQuizAttemptDetail,
  type GradeQuizAttemptPayload,
} from "../../lib/learning-api";
import { formatDateTime } from "../../lib/format";
import { useApiResource } from "../../lib/use-api-resource";

type QuizAttemptReviewDetailProps = {
  attemptId: string;
  backHref: string;
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

function getCorrectTone(question: DosenQuizAttemptDetail["questions"][number]) {
  if (question.isCorrect === true) return "success";
  if (question.isCorrect === false) return "danger";
  return "neutral";
}

function getCorrectLabel(question: DosenQuizAttemptDetail["questions"][number]) {
  if (question.isCorrect === true) return "Benar";
  if (question.isCorrect === false) return "Salah";
  return "Belum dinilai";
}

export function QuizAttemptReviewDetail({ attemptId, backHref }: QuizAttemptReviewDetailProps) {
  const { data, error, loading, reload } = useApiResource(
    () => getDosenQuizAttemptDetail(attemptId),
    [attemptId]
  );
  const [score, setScore] = useState("");
  const [action, setAction] = useState<GradeQuizAttemptPayload["action"]>("publish");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      setScore(data.score !== null ? String(data.score) : "");
      setAction(data.status === "retake" ? "retake" : "publish");
    }
  }, [data]);

  const questionSummary = useMemo(() => {
    const total = data?.questions.length ?? 0;
    const correct = data?.questions.filter((question) => question.isCorrect).length ?? 0;
    const points = data?.questions.reduce((sum, question) => sum + question.points, 0) ?? 0;
    const maxPoints = data?.questions.reduce((sum, question) => sum + question.maxPoints, 0) ?? 0;

    return { correct, maxPoints, points, total };
  }, [data]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedScore = score.trim();
    const parsedScore = trimmedScore ? Number(trimmedScore) : undefined;
    if (parsedScore !== undefined && (!Number.isInteger(parsedScore) || parsedScore < 0 || parsedScore > 100)) {
      setFeedback({ tone: "danger", message: "Skor manual harus berupa angka 0 sampai 100." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await gradeDosenQuizAttempt(attemptId, {
        action,
        score: parsedScore,
      });
      setFeedback({ tone: "success", message: "Review kuis berhasil disimpan." });
      reload();
    } catch (caught) {
      setFeedback({
        tone: "danger",
        message: caught instanceof Error ? caught.message : "Review kuis gagal disimpan.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <DashboardLoadingState title="Memuat detail attempt kuis" />;
  }

  if (error || !data) {
    return <DashboardErrorState message={error ?? "Detail attempt kuis kosong."} onRetry={reload} />;
  }

  return (
    <ReviewWorkspace>
      <ReviewFlowHeader
        backHref={backHref}
        backLabel="Kembali ke daftar pengumpulan kuis"
        title={data.assignmentTitle}
        description={`${data.studentName} · ${data.className} · Attempt ${data.attemptNumber} · ${formatDateTime(data.submittedAt)}`}
      />

      {feedback ? (
        <div
          className={
            feedback.tone === "success"
              ? "rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              : "rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          }
          role={feedback.tone === "success" ? "status" : "alert"}
        >
          {feedback.message}
        </div>
      ) : null}

      <section
        aria-label="Ringkasan attempt kuis"
        className="grid gap-6 border-y border-[#e5e5e5] py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
            Ringkasan Attempt
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
            {data.studentName}
          </h2>
          <p className="mt-2 text-[13px] text-slate-500">
            {questionSummary.correct}/{questionSummary.total} jawaban benar{" "}
            <span aria-hidden="true">&middot;</span> {questionSummary.points}/{questionSummary.maxPoints} poin otomatis
          </p>
        </div>
        <dl className="grid grid-cols-2 divide-x divide-[#e5e5e5] sm:min-w-[260px]">
          <div className="pr-6">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Status</dt>
            <dd className="mt-2">
              <StatusBadge tone={getQuizTone(data.status)}>{getQuizLabel(data.status)}</StatusBadge>
            </dd>
          </div>
          <div className="pl-6">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Skor</dt>
            <dd className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.05em] text-slate-950">
              {data.score ?? "-"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <ReviewSection
          title="Jawaban Mahasiswa"
          description="Bandingkan jawaban mahasiswa dengan kunci dan poin otomatis setiap soal."
          contentClassName="py-0"
        >
          <div className="divide-y divide-[#eeeeee]">
            {data.questions.map((question, index) => (
              <article key={question.id} className="py-6 first:pt-1 last:pb-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Soal {index + 1}
                    </p>
                    <h3 className="mt-2 text-[15px] font-semibold leading-7 text-slate-950">
                      {question.question}
                    </h3>
                  </div>
                  <StatusBadge tone={getCorrectTone(question)}>{getCorrectLabel(question)}</StatusBadge>
                </div>

                <dl className="mt-5 grid border-y border-[#eeeeee] py-4 md:grid-cols-2 md:divide-x md:divide-[#eeeeee]">
                  <div className="pb-4 md:pb-0 md:pr-5">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Jawaban mahasiswa
                    </dt>
                    <dd className="mt-2 text-sm font-semibold text-slate-800">
                      {question.studentAnswer ?? "-"}
                    </dd>
                  </div>
                  <div className="border-t border-[#eeeeee] pt-4 md:border-t-0 md:pl-5 md:pt-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Kunci jawaban
                    </dt>
                    <dd className="mt-2 text-sm font-semibold text-slate-800">{question.correctAnswer}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs font-medium text-slate-500">
                  Poin otomatis: {question.points}/{question.maxPoints}
                </p>
              </article>
            ))}
          </div>
        </ReviewSection>

        <div className="space-y-5">
          <ReviewSection title="Penilaian Manual">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Override Skor
                </span>
                <input
                  className="h-11 w-full rounded-[10px] border border-[#dedede] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-red-100"
                  max={100}
                  min={0}
                  onChange={(event) => setScore(event.target.value)}
                  placeholder="Kosongkan untuk skor otomatis"
                  type="number"
                  value={score}
                />
                <span className="mt-2 block text-[12px] leading-5 text-slate-500">Nilai manual harus berada di antara 0 dan 100.</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Aksi Review
                </span>
                <select
                  className="h-11 w-full rounded-[10px] border border-[#dedede] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-red-100"
                  onChange={(event) => setAction(event.target.value as GradeQuizAttemptPayload["action"])}
                  value={action}
                >
                  <option value="publish">Publish nilai</option>
                  <option value="draft">Simpan sebagai draft</option>
                  <option value="retake">Minta retake</option>
                </select>
              </label>

              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? "Menyimpan..." : "Simpan Review"}
              </button>
            </form>
          </ReviewSection>

          <ReviewSection title="Riwayat Attempt" contentClassName="py-0">
            <div className="divide-y divide-[#eeeeee]">
              {data.attemptHistory.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">Attempt {attempt.attemptNumber}</p>
                      {attempt.isLatest ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-strong)]">
                          Terbaru
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{formatDateTime(attempt.submittedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-semibold text-slate-950">{attempt.score ?? "-"}</p>
                    <StatusBadge tone={getQuizTone(attempt.status)}>{getQuizLabel(attempt.status)}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </ReviewSection>
        </div>
      </section>
    </ReviewWorkspace>
  );
}
