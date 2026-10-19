import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { LearningOutline } from "../components/learning/learning-outline";
import {
  LearningBreadcrumb,
  LearningPageHeader,
  LearningWorkspace,
  learningPanelClassName,
} from "../components/mahasiswa/learning-workspace";
import { StatusBadge } from "../components/status-badge";
import { cn } from "../lib/utils";
import {
  getMahasiswaQuiz,
  saveMahasiswaQuizAttempt,
  startMahasiswaQuiz,
  submitMahasiswaQuizAttempt,
  type MahasiswaQuizAttempt,
} from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MahasiswaQuizDetailPage() {
  const { quizId } = useParams();
  const { data: quiz, error, loading, reload } = useApiResource(
    () => getMahasiswaQuiz(quizId ?? ""),
    [quizId]
  );
  const [attempt, setAttempt] = useState<MahasiswaQuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [fullscreenViolation, setFullscreenViolation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<MahasiswaQuizAttempt | null>(null);

  useEffect(() => {
    if (!quiz) return;
    const activeAttempt = quiz.activeAttempt ?? null;
    const latestAttempt = quiz.latestSubmittedAttempt ?? null;

    setAttempt(activeAttempt);
    setAnswers(activeAttempt?.answers ?? latestAttempt?.answers ?? {});
    setRemainingSeconds(activeAttempt?.remainingSeconds ?? 0);
    setResult(latestAttempt);
  }, [quiz]);

  useEffect(() => {
    if (!attempt || attempt.durationSeconds <= 0 || attempt.status !== "in_progress") return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [attempt]);

  const orderedQuestions = useMemo(() => {
    if (!quiz) return [];
    const order = attempt?.questionOrder.length ? attempt.questionOrder : quiz.questionOrder;

    if (!order.length) return quiz.questions;

    return order
      .map((id) => quiz.questions.find((question) => question.id === id))
      .filter((question): question is NonNullable<typeof question> => Boolean(question));
  }, [attempt, quiz]);

  if (!quizId) {
    return (
      <AppShell>
        <DashboardErrorState message="ID kuis tidak valid." onRetry={reload} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat detail kuis" />
      </AppShell>
    );
  }

  if (error || !quiz) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Detail kuis kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const unansweredCount = orderedQuestions.filter((question) => !answers[question.id]).length;
  const phase = attempt ? "running" : result ? "submitted" : "intro";

  async function handleStart() {
    if (!quizId) return;

    setStarting(true);
    setFeedback("");

    try {
      const nextAttempt = await startMahasiswaQuiz(quizId);
      setAttempt(nextAttempt);
      setAnswers(nextAttempt.answers ?? {});
      setRemainingSeconds(nextAttempt.remainingSeconds);
      setResult(null);
      setFeedback("Kuis dimulai.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Gagal memulai kuis.");
    } finally {
      setStarting(false);
    }
  }

  async function handleAnswer(questionId: string, optionKey: string) {
    if (!quizId || !attempt || submitting) return;

    const nextAnswers = {
      ...answers,
      [questionId]: optionKey,
    };

    setAnswers(nextAnswers);
    setSaving(true);
    setFeedback("");

    try {
      const savedAttempt = await saveMahasiswaQuizAttempt(quizId, {
        attemptId: attempt.id,
        answers: nextAnswers,
      });
      setAttempt(savedAttempt);
      setRemainingSeconds(savedAttempt.remainingSeconds);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Autosave jawaban gagal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!quizId || !attempt || unansweredCount > 0) return;

    setSubmitting(true);
    setFeedback("");

    try {
      const submittedAttempt = await submitMahasiswaQuizAttempt(quizId, {
        attemptId: attempt.id,
        answers,
        fullscreenViolation,
      });
      setAttempt(null);
      setResult(submittedAttempt);
      setFeedback("Kuis berhasil dikirim.");
      reload();
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Gagal mengirim kuis.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <LearningWorkspace wide>
        <LearningBreadcrumb current={quiz.title} href={`/mahasiswa/modul/${quiz.courseId}`} />

        <LearningPageHeader
          description="Kerjakan sesuai ketentuan. Attempt, timer, autosave, dan penilaian tetap divalidasi oleh backend."
          eyebrow="Kuis"
          meta={
            <>
              <span>{quiz.questions.length} pertanyaan</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>{quiz.durationMinutes ? `${quiz.durationMinutes} menit` : "Tanpa batas waktu"}</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>{quiz.attemptsRemaining} attempt tersisa</span>
            </>
          }
          title={quiz.title}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className={`${learningPanelClassName} p-6 sm:p-8`}>
              {phase === "intro" ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                    Persiapan kuis
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
                    Ketentuan pengerjaan
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#737373]">
                    Pastikan waktu dan koneksi mencukupi sebelum memulai attempt baru.
                  </p>

                  <div className="mt-8 grid gap-x-8 gap-y-6 border-y border-[#e5e5e5] py-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Durasi" value={quiz.durationMinutes ? `${quiz.durationMinutes} menit` : "Tanpa batas"} />
                    <Metric label="Nilai lulus" value={quiz.passScore} />
                    <Metric label="Pertanyaan" value={quiz.questions.length} />
                    <Metric label="Attempt tersisa" value={`${quiz.attemptsRemaining}/${quiz.maxAttempts}`} />
                  </div>

                  <button
                    className="mt-8 min-h-11 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={starting || quiz.questions.length === 0 || quiz.attemptsRemaining <= 0}
                    onClick={() => void handleStart()}
                    type="button"
                  >
                    {starting
                      ? "Memulai..."
                      : quiz.attemptsRemaining <= 0
                        ? "Batas attempt tercapai"
                        : "Mulai kuis"}
                  </button>
                </>
              ) : phase === "running" && attempt ? (
                <>
                  <div className="flex flex-col gap-5 border-b border-[#e5e5e5] pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                        Attempt {attempt.attemptNumber} dari {quiz.maxAttempts}
                      </p>
                      <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
                        Jawab seluruh pertanyaan
                      </h2>
                      <p className="mt-2 text-xs text-[#737373]">
                        {saving ? "Menyimpan jawaban..." : `${unansweredCount} pertanyaan belum dijawab`}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">Sisa waktu</p>
                      <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#0a0a0a]">
                        {attempt.durationSeconds > 0 ? formatRemainingTime(remainingSeconds) : "Tanpa batas"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-5">
                    {orderedQuestions.map((question, index) => (
                      <fieldset className="rounded-[12px] border border-[#e5e5e5] p-5 sm:p-6" key={question.id}>
                        <legend className="sr-only">Pertanyaan {index + 1}</legend>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                          Pertanyaan {index + 1}
                        </p>
                        <p className="mt-3 text-[18px] font-semibold leading-7 tracking-[-0.025em] text-[#0a0a0a]">
                          {question.prompt}
                        </p>
                        <div className="mt-5 grid gap-3">
                          {question.options.map((option) => {
                            const selected = answers[question.id] === option.key;

                            return (
                              <button
                                className={cn(
                                  "min-h-11 rounded-[10px] border px-4 py-3 text-left text-sm leading-6 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200",
                                  selected
                                    ? "border-[#171717] bg-[#171717] text-white"
                                    : "border-[#e5e5e5] bg-white text-slate-700 hover:bg-[#f5f5f5]"
                                )}
                                disabled={submitting}
                                key={option.key}
                                onClick={() => void handleAnswer(question.id, option.key)}
                                type="button"
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>

                  <label className="mt-6 flex items-start gap-3 border-y border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                    <input
                      checked={fullscreenViolation}
                      className="mt-1 accent-amber-700"
                      onChange={(event) => setFullscreenViolation(event.target.checked)}
                      type="checkbox"
                    />
                    <span>{quiz.penaltyNote}</span>
                  </label>

                  <button
                    className="mt-6 min-h-11 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving || submitting || unansweredCount > 0 || orderedQuestions.length === 0}
                    onClick={() => void handleSubmit()}
                    type="button"
                  >
                    {saving
                      ? "Menyimpan jawaban..."
                      : submitting
                        ? "Mengirim..."
                        : unansweredCount > 0
                          ? "Lengkapi jawaban"
                          : "Kirim jawaban"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                    Hasil kuis
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
                    Ringkasan attempt terakhir
                  </h2>
                  <div className="mt-8 rounded-[12px] bg-[#171717] p-7 text-white sm:p-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Nilai</p>
                    <p className="mt-3 text-6xl font-semibold tracking-[-0.05em]">{result?.score ?? 0}</p>
                    <p className="mt-4 text-sm text-slate-300">
                      {result?.isPassed ? "Status lulus" : "Belum lulus"} dengan nilai minimum {quiz.passScore}.
                    </p>
                  </div>
                  {quiz.attemptsRemaining > 0 && !result?.isPassed ? (
                    <button
                      className="mt-6 min-h-11 rounded-[10px] border border-[#e5e5e5] bg-white px-5 py-3 text-sm font-semibold text-[#171717] transition hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:opacity-60"
                      disabled={starting}
                      onClick={() => void handleStart()}
                      type="button"
                    >
                      {starting ? "Memulai..." : "Ulangi kuis"}
                    </button>
                  ) : null}
                </>
              )}
            </section>

            {feedback ? (
              <div className="rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-slate-600" role="status">
                {feedback}
              </div>
            ) : null}
          </div>

          <aside className="space-y-8">
            <section className={`${learningPanelClassName} p-5 sm:p-6`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
                Status kuis
              </p>
              <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">Attempt</h2>
              <dl className="mt-5 divide-y divide-[#eeeeee] text-sm">
                <div className="flex items-center justify-between py-3 first:pt-0">
                  <dt className="text-[#737373]">Terpakai</dt>
                  <dd className="font-semibold text-[#0a0a0a]">{quiz.attemptsUsed}</dd>
                </div>
                <div className="flex items-center justify-between py-3 last:pb-0">
                  <dt className="text-[#737373]">Tersisa</dt>
                  <dd className="font-semibold text-[#0a0a0a]">{quiz.attemptsRemaining}</dd>
                </div>
              </dl>
              {result ? (
                <div className="mt-5 border-t border-[#e5e5e5] pt-5">
                  <StatusBadge tone={result.isPassed ? "success" : "warning"}>
                    Nilai terakhir {result.score ?? 0}
                  </StatusBadge>
                </div>
              ) : null}
            </section>

            <LearningOutline
              activeItem={{
                id: quiz.id,
                type: "quiz",
              }}
              items={quiz.sidebar}
            />
          </aside>
        </div>
      </LearningWorkspace>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">{label}</p>
      <p className="mt-2 text-[19px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">{value}</p>
    </div>
  );
}
