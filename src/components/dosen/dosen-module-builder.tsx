import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { DashboardPanel } from "../dashboard/dashboard-panel";
import { ProgressIndicator } from "../dashboard/progress-indicator";
import { StatusBadge } from "../status-badge";
import { cn } from "../../lib/utils";
import type {
  DosenLessonPayload,
  DosenLessonUpdatePayload,
  DosenModuleDetail,
  DosenQuestionPayload,
  DosenQuizPayload,
  DosenQuizUpdatePayload,
  DosenTaskPayload,
  DosenTaskUpdatePayload,
} from "../../lib/learning-api";

type BuilderKind = "Materi" | "Kuis" | "Tugas";

type BuilderDraft = {
  mode: "create" | "edit";
  itemId?: string;
  kind: BuilderKind;
  sectionId: string;
  title: string;
  description: string;
  contentType: DosenLessonPayload["tipeKonten"];
  contentUrl: string;
  durationMinutes: string;
  availableAt: string;
  deadline: string;
  status: "draft" | "published";
  submitMethod: NonNullable<DosenTaskPayload["submitMethod"]>;
  allowRevision: boolean;
  passScore: string;
  quizDurationMinutes: string;
  questionPrompt: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  opsiBenar: DosenQuestionPayload["opsiBenar"];
};

type BuilderItem = {
  id: string;
  kind: BuilderKind;
  title: string;
  description: string;
  status: "draft" | "published";
  meta: string[];
  rank: number;
  sectionId: string;
};

type DosenModuleBuilderProps = {
  module: DosenModuleDetail;
  onCreateSection: (payload: { offeringId: string; judul: string; urutan?: number }) => Promise<unknown>;
  onCreateLesson: (payload: DosenLessonPayload) => Promise<unknown>;
  onCreateQuiz: (payload: DosenQuizPayload) => Promise<unknown>;
  onCreateTask: (payload: DosenTaskPayload) => Promise<unknown>;
  onUpdateSection: (sectionId: string, payload: { judul?: string; urutan?: number }) => Promise<unknown>;
  onDeleteSection: (sectionId: string) => Promise<unknown>;
  onUpdateLesson: (lessonId: string, payload: DosenLessonUpdatePayload) => Promise<unknown>;
  onUpdateLessonStatus: (lessonId: string, status: NonNullable<DosenLessonPayload["status"]>) => Promise<unknown>;
  onDeleteLesson: (lessonId: string) => Promise<unknown>;
  onUpdateQuiz: (quizId: string, payload: DosenQuizUpdatePayload) => Promise<unknown>;
  onUpdateQuizStatus: (quizId: string, isAktif: boolean) => Promise<unknown>;
  onDeleteQuiz: (quizId: string) => Promise<unknown>;
  onUpdateTask: (taskId: string, payload: DosenTaskUpdatePayload) => Promise<unknown>;
  onUpdateTaskStatus: (
    taskId: string,
    payload: { isAktif: boolean; status?: "draft" | "published" }
  ) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  onReload: () => void;
};

const kindTheme: Record<BuilderKind, { badge: string; tone: "primary" | "warning" | "success" }> = {
  Materi: { badge: "Materi", tone: "primary" },
  Kuis: { badge: "Kuis", tone: "warning" },
  Tugas: { badge: "Tugas", tone: "success" },
};

const inputClassName =
  "h-11 w-full rounded-[10px] border border-[#dedede] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-red-100";
const textareaClassName =
  "min-h-28 w-full rounded-[10px] border border-[#dedede] bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-red-100";

function getRank(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ");
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toPositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toOptionalDate(value: string) {
  if (!value.trim()) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function toDateTimeInputValue(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function createDraft(sectionId: string, kind: BuilderKind): BuilderDraft {
  return {
    mode: "create",
    kind,
    sectionId,
    title: "",
    description: "",
    contentType: "link",
    contentUrl: "",
    durationMinutes: "",
    availableAt: "",
    deadline: "",
    status: "published",
    submitMethod: "file_link",
    allowRevision: true,
    passScore: "70",
    quizDurationMinutes: "30",
    questionPrompt: "",
    opsiA: "",
    opsiB: "",
    opsiC: "",
    opsiD: "",
    opsiBenar: "A",
  };
}

function createEditDraft(module: DosenModuleDetail, item: BuilderItem): BuilderDraft {
  const baseDraft = createDraft(item.sectionId, item.kind);

  if (item.kind === "Materi") {
    const lesson = module.lessons.find((entry) => entry.id === item.id);

    return {
      ...baseDraft,
      mode: "edit",
      itemId: item.id,
      title: lesson?.title ?? item.title,
      description: lesson?.body ?? item.description,
      contentType: lesson?.contentType ?? "link",
      contentUrl: lesson?.contentUrl ?? "",
      durationMinutes: lesson?.durationMinutes ? String(lesson.durationMinutes) : "",
      availableAt: toDateTimeInputValue(lesson?.availableAt),
      status: lesson?.status ?? item.status,
    };
  }

  if (item.kind === "Kuis") {
    const quiz = module.quizzes.find((entry) => entry.id === item.id);

    return {
      ...baseDraft,
      mode: "edit",
      itemId: item.id,
      title: quiz?.title ?? item.title,
      passScore: quiz?.passScore ? String(quiz.passScore) : "70",
      quizDurationMinutes: quiz?.durationMinutes ? String(quiz.durationMinutes) : "",
      availableAt: toDateTimeInputValue(quiz?.availableAt),
      deadline: toDateTimeInputValue(quiz?.deadline),
      status: quiz?.isActive ? "published" : "draft",
      questionPrompt: "",
    };
  }

  const task = module.tasks.find((entry) => entry.id === item.id);

  return {
    ...baseDraft,
    mode: "edit",
    itemId: item.id,
    title: task?.title ?? item.title,
    description: task?.description ?? item.description,
    availableAt: toDateTimeInputValue(task?.availableAt),
    deadline: toDateTimeInputValue(task?.deadline),
    status: task?.status ?? item.status,
    submitMethod: task?.submitMethod ?? "file_link",
    allowRevision: task?.allowRevision ?? true,
  };
}

function getItemsForSection(module: DosenModuleDetail, sectionId: string): BuilderItem[] {
  const lessons: BuilderItem[] = module.lessons
    .filter((lesson) => lesson.sectionId === sectionId)
    .map((lesson, index) => ({
      id: lesson.id,
      kind: "Materi",
      title: lesson.title,
      description: lesson.body,
      status: lesson.status,
      rank: getRank(lesson.position, index),
      sectionId,
      meta: [
        `Tipe: ${lesson.contentType.toUpperCase()}`,
        lesson.durationMinutes ? `Durasi: ${lesson.durationMinutes} menit` : "Durasi: -",
        formatDateTime(lesson.availableAt) ? `Tersedia: ${formatDateTime(lesson.availableAt)}` : "Tersedia: langsung",
      ],
    }));

  const quizzes: BuilderItem[] = module.quizzes
    .filter((quiz) => quiz.sectionId === sectionId)
    .map((quiz, index) => ({
      id: quiz.id,
      kind: "Kuis",
      title: quiz.title,
      description: `${quiz.questionCount} soal dari bank kuis mata kuliah.`,
      status: quiz.isActive ? "published" : "draft",
      rank: getRank(quiz.position, 100000 + index),
      sectionId,
      meta: [
        `Pass score: ${quiz.passScore}`,
        quiz.durationMinutes ? `Durasi: ${quiz.durationMinutes} menit` : "Durasi: -",
        formatDateTime(quiz.deadline) ? `Deadline: ${formatDateTime(quiz.deadline)}` : "Deadline: -",
      ],
    }));

  const tasks: BuilderItem[] = module.tasks
    .filter((task) => task.sectionId === sectionId)
    .map((task, index) => ({
      id: task.id,
      kind: "Tugas",
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      rank: getRank(task.position, 200000 + index),
      sectionId,
      meta: [
        formatDateTime(task.availableAt) ? `Mulai: ${formatDateTime(task.availableAt)}` : "Mulai: langsung",
        `Deadline: ${formatDateTime(task.deadline) ?? "-"}`,
        `Metode: ${task.submitMethod.replace("_", " + ")}`,
      ],
    }));

  return [...lessons, ...quizzes, ...tasks].sort((left, right) => left.rank - right.rank);
}

function validateDraft(draft: BuilderDraft) {
  const missing: string[] = [];

  if (!draft.title.trim()) missing.push("Judul");

  if (draft.kind !== "Kuis" && !draft.description.trim()) {
    missing.push("Deskripsi");
  }

  if (draft.kind === "Materi" && draft.contentType !== "text" && !draft.contentUrl.trim()) {
    missing.push("URL Konten");
  }

  if (draft.kind === "Tugas" && !draft.deadline.trim()) {
    missing.push("Deadline Tugas");
  }

  if (draft.kind === "Kuis") {
    if (!draft.deadline.trim()) missing.push("Deadline Kuis");
    if (draft.mode === "create" || draft.questionPrompt.trim()) {
      if (!draft.questionPrompt.trim()) missing.push("Pertanyaan");
      if (!draft.opsiA.trim()) missing.push("Opsi A");
      if (!draft.opsiB.trim()) missing.push("Opsi B");
      if (!draft.opsiC.trim()) missing.push("Opsi C");
      if (!draft.opsiD.trim()) missing.push("Opsi D");
    }
  }

  if (draft.availableAt && draft.deadline && draft.availableAt >= draft.deadline) {
    return "Deadline harus setelah waktu mulai.";
  }

  return missing.length > 0 ? `Lengkapi field wajib: ${missing.join(", ")}.` : "";
}

export function DosenModuleBuilder({
  module,
  onCreateSection,
  onCreateLesson,
  onCreateQuiz,
  onCreateTask,
  onUpdateSection,
  onDeleteSection,
  onUpdateLesson,
  onUpdateLessonStatus,
  onDeleteLesson,
  onUpdateQuiz,
  onUpdateQuizStatus,
  onDeleteQuiz,
  onUpdateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onReload,
}: DosenModuleBuilderProps) {
  const [activeDraft, setActiveDraft] = useState<BuilderDraft | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  const totalItems = module.lessons.length + module.quizzes.length + module.tasks.length;
  const publishedItems =
    module.lessons.filter((lesson) => lesson.status === "published").length +
    module.quizzes.filter((quiz) => quiz.isActive).length +
    module.tasks.filter((task) => task.status === "published").length;
  const completionRate = totalItems > 0 ? Math.round((publishedItems / totalItems) * 100) : 0;

  async function handleCreateSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = chapterTitle.trim();
    if (!title) {
      setFeedback({ tone: "danger", message: "Judul bab wajib diisi." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await onCreateSection({
        offeringId: module.id,
        judul: title,
        urutan: module.sections.length + 1,
      });
      setChapterTitle("");
      setFeedback({ tone: "success", message: "Bab berhasil ditambahkan." });
      onReload();
    } catch (error) {
      setFeedback({
        tone: "danger",
        message: error instanceof Error ? error.message : "Bab gagal ditambahkan.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeDraft) return;

    const validationMessage = validateDraft(activeDraft);
    if (validationMessage) {
      setFeedback({ tone: "danger", message: validationMessage });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      if (activeDraft.kind === "Materi") {
        const payload: DosenLessonPayload = {
          moduleStudentClassId: module.id,
          sectionId: activeDraft.sectionId,
          judul: activeDraft.title.trim(),
          tipeKonten: activeDraft.contentType,
          konten: activeDraft.description.trim(),
          urlKonten: activeDraft.contentType === "text" ? undefined : activeDraft.contentUrl.trim(),
          durasi: toPositiveNumber(activeDraft.durationMinutes),
          tersediaPada: toOptionalDate(activeDraft.availableAt),
          status: activeDraft.status,
        };

        if (activeDraft.mode === "edit" && activeDraft.itemId) {
          await onUpdateLesson(activeDraft.itemId, {
            sectionId: payload.sectionId,
            judul: payload.judul,
            tipeKonten: payload.tipeKonten,
            konten: payload.konten,
            urlKonten: payload.urlKonten,
            durasi: payload.durasi,
            tersediaPada: payload.tersediaPada,
            status: payload.status,
          });
        } else {
          await onCreateLesson(payload);
        }
      }

      if (activeDraft.kind === "Kuis") {
        const questions =
          activeDraft.questionPrompt.trim()
            ? [
                {
                  pertanyaan: activeDraft.questionPrompt.trim(),
                  opsiA: activeDraft.opsiA.trim(),
                  opsiB: activeDraft.opsiB.trim(),
                  opsiC: activeDraft.opsiC.trim(),
                  opsiD: activeDraft.opsiD.trim(),
                  opsiBenar: activeDraft.opsiBenar,
                },
              ]
            : undefined;
        const payload: DosenQuizPayload = {
          moduleStudentClassId: module.id,
          sectionId: activeDraft.sectionId,
          judul: activeDraft.title.trim(),
          skorLulus: toPositiveNumber(activeDraft.passScore),
          durasiMenit: toPositiveNumber(activeDraft.quizDurationMinutes),
          availableAt: toOptionalDate(activeDraft.availableAt),
          deadline: toOptionalDate(activeDraft.deadline),
          isAktif: activeDraft.status === "published",
          questions: questions ?? [],
        };

        if (activeDraft.mode === "edit" && activeDraft.itemId) {
          await onUpdateQuiz(activeDraft.itemId, {
            sectionId: payload.sectionId,
            judul: payload.judul,
            skorLulus: payload.skorLulus,
            durasiMenit: payload.durasiMenit,
            availableAt: payload.availableAt,
            deadline: payload.deadline,
            isAktif: payload.isAktif,
            ...(payload.questions.length > 0 && { questions: payload.questions }),
          });
        } else {
          await onCreateQuiz({ ...payload, questions: questions ?? [] });
        }
      }

      if (activeDraft.kind === "Tugas") {
        const payload: DosenTaskPayload = {
          moduleStudentClassId: module.id,
          sectionId: activeDraft.sectionId,
          judul: activeDraft.title.trim(),
          deskripsi: activeDraft.description.trim(),
          availableAt: toOptionalDate(activeDraft.availableAt),
          deadline: toOptionalDate(activeDraft.deadline) ?? activeDraft.deadline,
          submitMethod: activeDraft.submitMethod,
          allowRevision: activeDraft.allowRevision,
          status: activeDraft.status,
          isAktif: activeDraft.status === "published",
        };

        if (activeDraft.mode === "edit" && activeDraft.itemId) {
          await onUpdateTask(activeDraft.itemId, {
            sectionId: payload.sectionId,
            judul: payload.judul,
            deskripsi: payload.deskripsi,
            availableAt: payload.availableAt,
            deadline: payload.deadline,
            submitMethod: payload.submitMethod,
            allowRevision: payload.allowRevision,
            status: payload.status,
            isAktif: payload.isAktif,
          });
        } else {
          await onCreateTask(payload);
        }
      }

      setActiveDraft(null);
      setFeedback({
        tone: "success",
        message:
          activeDraft.mode === "edit"
            ? `${activeDraft.kind} berhasil diperbarui.`
            : `${activeDraft.kind} berhasil ditambahkan ke bab.`,
      });
      onReload();
    } catch (error) {
      setFeedback({
        tone: "danger",
        message: error instanceof Error ? error.message : `${activeDraft.kind} gagal disimpan.`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function runBuilderMutation(action: () => Promise<unknown>, successMessage: string, fallbackMessage: string) {
    setSaving(true);
    setFeedback(null);

    try {
      await action();
      setFeedback({ tone: "success", message: successMessage });
      onReload();
    } catch (error) {
      setFeedback({
        tone: "danger",
        message: error instanceof Error ? error.message : fallbackMessage,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSection) return;

    const title = editingSection.title.trim();
    if (!title) {
      setFeedback({ tone: "danger", message: "Judul bab wajib diisi." });
      return;
    }

    await runBuilderMutation(
      () => onUpdateSection(editingSection.id, { judul: title }),
      "Bab berhasil diperbarui.",
      "Bab gagal diperbarui."
    );
    setEditingSection(null);
  }

  async function handleDeleteSection(sectionId: string) {
    if (!window.confirm("Hapus bab ini? Pastikan tidak ada item penting di dalamnya.")) return;

    await runBuilderMutation(
      () => onDeleteSection(sectionId),
      "Bab berhasil dihapus.",
      "Bab gagal dihapus. Jika bab masih berisi item, pindahkan atau hapus item terlebih dahulu."
    );
  }

  async function handleMoveSection(sectionIndex: number, direction: -1 | 1) {
    const current = module.sections[sectionIndex];
    const target = module.sections[sectionIndex + direction];
    if (!current || !target) return;

    await runBuilderMutation(
      async () => {
        await onUpdateSection(current.id, { urutan: target.order });
        await onUpdateSection(target.id, { urutan: current.order });
      },
      "Urutan bab berhasil diperbarui.",
      "Urutan bab gagal diperbarui."
    );
  }

  function getItemPositionPayload(item: BuilderItem, position: number) {
    if (item.kind === "Materi") return () => onUpdateLesson(item.id, { posisi: position });
    if (item.kind === "Kuis") return () => onUpdateQuiz(item.id, { posisi: position });
    return () => onUpdateTask(item.id, { posisi: position });
  }

  async function handleMoveItem(items: BuilderItem[], itemIndex: number, direction: -1 | 1) {
    const current = items[itemIndex];
    const target = items[itemIndex + direction];
    if (!current || !target) return;

    await runBuilderMutation(
      async () => {
        await getItemPositionPayload(current, target.rank)();
        await getItemPositionPayload(target, current.rank)();
      },
      "Urutan item berhasil diperbarui.",
      "Urutan item gagal diperbarui."
    );
  }

  async function handleToggleItemStatus(item: BuilderItem) {
    const nextStatus = item.status === "published" ? "draft" : "published";

    await runBuilderMutation(
      () => {
        if (item.kind === "Materi") return onUpdateLessonStatus(item.id, nextStatus);
        if (item.kind === "Kuis") return onUpdateQuizStatus(item.id, nextStatus === "published");
        return onUpdateTaskStatus(item.id, {
          isAktif: nextStatus === "published",
          status: nextStatus,
        });
      },
      `${item.kind} berhasil diubah menjadi ${nextStatus === "published" ? "published" : "draft"}.`,
      "Status item gagal diperbarui."
    );
  }

  async function handleDeleteItem(item: BuilderItem) {
    if (!window.confirm(`Hapus ${item.kind.toLowerCase()} "${item.title}"?`)) return;

    await runBuilderMutation(
      () => {
        if (item.kind === "Materi") return onDeleteLesson(item.id);
        if (item.kind === "Kuis") return onDeleteQuiz(item.id);
        return onDeleteTask(item.id);
      },
      `${item.kind} berhasil dihapus.`,
      `${item.kind} gagal dihapus.`
    );
  }

  return (
    <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
      <div className="mx-auto max-w-[1320px] space-y-10">
        <header className="border-b border-[#e5e5e5] pb-9">
          <Link
            to="/dosen/mata-kuliah"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
          >
            ← Kembali ke Mata Kuliah
          </Link>
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
                Detail Mata Kuliah
              </p>
              <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[38px]">
                {module.title}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">
                {module.description ?? "Susun alur pembelajaran dengan bab, materi, kuis, dan tugas."}
              </p>
              <p className="mt-4 text-[13px] text-slate-500">
                {module.department} <span aria-hidden="true">·</span> {module.gradeLevel}
              </p>
            </div>
            <div className="border-t border-[#e5e5e5] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <ProgressIndicator label="Kelengkapan konten" value={completionRate} />
              <p className="mt-5 text-[13px] leading-6 text-slate-500">
                {module.sections.length} bab <span aria-hidden="true">·</span> {module.lessons.length} materi{" "}
                <span aria-hidden="true">·</span> {module.quizzes.length} kuis{" "}
                <span aria-hidden="true">·</span> {module.tasks.length} tugas
              </p>
            </div>
          </div>
        </header>

        {feedback ? (
          <div
            className={cn(
              "rounded-[12px] border px-4 py-3 text-sm font-semibold",
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <DashboardPanel
          className="!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none"
          title="Struktur Mata Kuliah"
          description="Atur urutan bab dan seluruh aktivitas pembelajaran di dalamnya."
          action={
            <span className="text-sm font-medium text-slate-500">
              {totalItems} item
            </span>
          }
        >
          <div className="space-y-4">
            {module.sections.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-slate-300 bg-[#fafafa] p-8 text-center">
                <p className="text-sm font-semibold text-slate-950">Belum ada bab.</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tambahkan bab terlebih dahulu agar tombol Materi, Kuis, dan Tugas tersedia.
                </p>
              </div>
            ) : (
              module.sections.map((section, sectionIndex) => {
                const items = getItemsForSection(module, section.id);

                return (
                  <article
                    key={section.id}
                    className="rounded-[10px] border border-[#e5e5e5] bg-white p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {editingSection?.id === section.id ? (
                        <form className="min-w-0 flex-1" onSubmit={handleUpdateSection}>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Edit Bab {sectionIndex + 1}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <input
                              className={inputClassName}
                              value={editingSection.title}
                              onChange={(event) =>
                                setEditingSection({ ...editingSection, title: event.target.value })
                              }
                            />
                            <div className="flex gap-2">
                              <button
                                className="rounded-[10px] bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                disabled={saving}
                                type="submit"
                              >
                                Simpan
                              </button>
                              <button
                                className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                onClick={() => setEditingSection(null)}
                                type="button"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Bab {sectionIndex + 1}
                          </p>
                          <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-950">
                            {section.title}
                          </h2>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          disabled={saving || sectionIndex === 0}
                          onClick={() => void handleMoveSection(sectionIndex, -1)}
                          className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Naik
                        </button>
                        <button
                          type="button"
                          disabled={saving || sectionIndex === module.sections.length - 1}
                          onClick={() => void handleMoveSection(sectionIndex, 1)}
                          className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Turun
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setEditingSection({ id: section.id, title: section.title })}
                          className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Edit Bab
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleDeleteSection(section.id)}
                          className="cursor-pointer rounded-[10px] border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Hapus Bab
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#eeeeee] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium text-slate-500">Tambah konten ke bab ini</p>
                      <div className="flex flex-wrap gap-2">
                        {(["Materi", "Kuis", "Tugas"] as BuilderKind[]).map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            disabled={saving}
                            onClick={() => setActiveDraft(createDraft(section.id, kind))}
                            className="min-h-10 cursor-pointer rounded-[10px] border border-slate-200 bg-[#f7f7f7] px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            + {kind}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {items.length === 0 ? (
                        <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                          Belum ada item pada bab ini.
                        </div>
                      ) : (
                        items.map((item, itemIndex) => {
                          return (
                            <div
                              key={`${item.kind}-${item.id}`}
                              className="grid gap-4 rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4 xl:grid-cols-[minmax(0,1fr)_auto]"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusBadge tone={kindTheme[item.kind].tone}>
                                    {kindTheme[item.kind].badge}
                                  </StatusBadge>
                                  <StatusBadge tone={item.status === "published" ? "success" : "neutral"}>
                                    {item.status === "published" ? "Published" : "Draft"}
                                  </StatusBadge>
                                </div>
                                <p className="mt-2 font-semibold text-slate-950">{item.title}</p>
                                {item.description ? (
                                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                              <div className="space-y-3 xl:max-w-[340px]">
                                <p className="text-xs leading-5 text-slate-500 xl:text-right">
                                  {item.meta.join(" / ")}
                                </p>
                                <div className="flex flex-wrap gap-1.5 xl:justify-end">
                                  <button
                                    type="button"
                                    disabled={saving || itemIndex === 0}
                                    onClick={() => void handleMoveItem(items, itemIndex, -1)}
                                    className="rounded-[9px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    Naik
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving || itemIndex === items.length - 1}
                                    onClick={() => void handleMoveItem(items, itemIndex, 1)}
                                    className="rounded-[9px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    Turun
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setActiveDraft(createEditDraft(module, item))}
                                    className="rounded-[9px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void handleToggleItemStatus(item)}
                                    className="rounded-[9px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    {item.status === "published" ? "Draft" : "Publish"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void handleDeleteItem(item)}
                                    className="rounded-[9px] border border-red-100 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </DashboardPanel>

          <div className="space-y-5">
          <DashboardPanel
            className="!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none"
            title="Tambah Bab"
          >
            <form className="space-y-3" onSubmit={handleCreateSection}>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Judul Bab
                </span>
                <input
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                  placeholder="Contoh: Bab 1 - Dasar Konsep"
                  className={inputClassName}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 w-full cursor-pointer rounded-[10px] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Bab"}
              </button>
            </form>
          </DashboardPanel>

          {activeDraft ? (
            <DashboardPanel
              className="!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none"
              title={`${activeDraft.mode === "edit" ? "Edit" : "Input Detail"} ${activeDraft.kind}`}
              description={
                activeDraft.kind === "Kuis" && activeDraft.mode === "edit"
                  ? "Kosongkan field pertanyaan jika hanya ingin mengubah judul, waktu, skor, atau status kuis."
                  : undefined
              }
            >
              <form className="space-y-3" onSubmit={handleSaveDraft}>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Judul
                  </span>
                  <input
                    value={activeDraft.title}
                    onChange={(event) => setActiveDraft({ ...activeDraft, title: event.target.value })}
                    placeholder={
                      activeDraft.kind === "Materi"
                        ? "Contoh judul materi"
                        : activeDraft.kind === "Kuis"
                          ? "Contoh judul kuis"
                          : "Contoh judul tugas"
                    }
                    className={inputClassName}
                  />
                </label>

                {activeDraft.kind !== "Kuis" ? (
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Deskripsi
                    </span>
                    <textarea
                      value={activeDraft.description}
                      onChange={(event) => setActiveDraft({ ...activeDraft, description: event.target.value })}
                      placeholder="Ringkasan singkat untuk mahasiswa"
                      className={textareaClassName}
                    />
                  </label>
                ) : null}

                {activeDraft.kind === "Materi" ? (
                  <>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Content Type
                      </span>
                      <select
                        value={activeDraft.contentType}
                        onChange={(event) =>
                          setActiveDraft({
                            ...activeDraft,
                            contentType: event.target.value as DosenLessonPayload["tipeKonten"],
                          })
                        }
                        className={inputClassName}
                      >
                        <option value="link">Link</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                        <option value="text">Text</option>
                      </select>
                    </label>
                    {activeDraft.contentType !== "text" ? (
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                          URL Konten
                        </span>
                        <input
                          value={activeDraft.contentUrl}
                          onChange={(event) => setActiveDraft({ ...activeDraft, contentUrl: event.target.value })}
                          placeholder="https://..."
                          className={inputClassName}
                        />
                      </label>
                    ) : null}
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Durasi
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={activeDraft.durationMinutes}
                        onChange={(event) =>
                          setActiveDraft({ ...activeDraft, durationMinutes: event.target.value })
                        }
                        placeholder="Menit"
                        className={inputClassName}
                      />
                    </label>
                  </>
                ) : null}

                {activeDraft.kind === "Kuis" ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                          Pass Score
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeDraft.passScore}
                          onChange={(event) => setActiveDraft({ ...activeDraft, passScore: event.target.value })}
                          className={inputClassName}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                          Durasi
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={activeDraft.quizDurationMinutes}
                          onChange={(event) =>
                            setActiveDraft({ ...activeDraft, quizDurationMinutes: event.target.value })
                          }
                          className={inputClassName}
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Pertanyaan Pertama
                      </span>
                      <textarea
                        value={activeDraft.questionPrompt}
                        onChange={(event) => setActiveDraft({ ...activeDraft, questionPrompt: event.target.value })}
                        placeholder={
                          activeDraft.mode === "edit"
                            ? "Opsional: isi jika ingin mengganti set soal kuis"
                            : "Tulis pertanyaan kuis"
                        }
                        className={textareaClassName}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["A", "B", "C", "D"] as const).map((option) => (
                        <label key={option} className="block">
                          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Opsi {option}
                          </span>
                          <input
                            value={activeDraft[`opsi${option}`]}
                            onChange={(event) =>
                              setActiveDraft({ ...activeDraft, [`opsi${option}`]: event.target.value })
                            }
                            className={inputClassName}
                          />
                        </label>
                      ))}
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Jawaban Benar
                      </span>
                      <select
                        value={activeDraft.opsiBenar}
                        onChange={(event) =>
                          setActiveDraft({
                            ...activeDraft,
                            opsiBenar: event.target.value as DosenQuestionPayload["opsiBenar"],
                          })
                        }
                        className={inputClassName}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </label>
                  </>
                ) : null}

                {activeDraft.kind === "Tugas" ? (
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Metode Submit
                    </span>
                    <select
                      value={activeDraft.submitMethod}
                      onChange={(event) =>
                        setActiveDraft({
                          ...activeDraft,
                          submitMethod: event.target.value as NonNullable<DosenTaskPayload["submitMethod"]>,
                        })
                      }
                      className={inputClassName}
                    >
                      <option value="file_link">File + Link</option>
                      <option value="file">File</option>
                      <option value="link">Link</option>
                    </select>
                  </label>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Waktu Mulai
                    </span>
                    <input
                      type="datetime-local"
                      value={activeDraft.availableAt}
                      onChange={(event) => setActiveDraft({ ...activeDraft, availableAt: event.target.value })}
                      className={inputClassName}
                    />
                  </label>
                  {activeDraft.kind !== "Materi" ? (
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Deadline
                      </span>
                      <input
                        type="datetime-local"
                        value={activeDraft.deadline}
                        onChange={(event) => setActiveDraft({ ...activeDraft, deadline: event.target.value })}
                        className={inputClassName}
                      />
                    </label>
                  ) : null}
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </span>
                  <select
                    value={activeDraft.status}
                    onChange={(event) =>
                      setActiveDraft({ ...activeDraft, status: event.target.value as BuilderDraft["status"] })
                    }
                    className={inputClassName}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>

                {activeDraft.kind === "Tugas" ? (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={activeDraft.allowRevision}
                      onChange={(event) =>
                        setActiveDraft({ ...activeDraft, allowRevision: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)]"
                    />
                    Izinkan revisi pengumpulan
                  </label>
                ) : null}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveDraft(null)}
                    className="min-h-11 cursor-pointer rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-11 cursor-pointer rounded-[10px] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : activeDraft.mode === "edit" ? "Simpan Perubahan" : "Simpan ke Bab"}
                  </button>
                </div>
              </form>
            </DashboardPanel>
          ) : (
            <DashboardPanel
              className="!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none"
              title="Panduan Singkat"
            >
              <div className="text-sm leading-7 text-slate-600">
                <ol className="list-decimal space-y-2 pl-4 marker:font-semibold marker:text-slate-400">
                  <li>Pilih atau tambah Bab terlebih dahulu.</li>
                  <li>Klik + Materi, + Kuis, atau + Tugas pada bab tujuan.</li>
                  <li>Isi form detail di panel kanan lalu simpan.</li>
                  <li>Data akan langsung dimuat ulang dari backend.</li>
                </ol>
              </div>
            </DashboardPanel>
          )}

          <DashboardPanel
            className="!rounded-[12px] !border-[#e5e5e5] !bg-white !shadow-none"
            title="Ringkasan"
          >
            <dl className="divide-y divide-[#eeeeee] text-sm">
              <div className="flex items-center justify-between gap-4 pb-4">
                <dt className="text-slate-500">Item published</dt>
                <dd className="text-lg font-semibold text-slate-950">{publishedItems}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <dt className="text-slate-500">Total konten</dt>
                <dd className="text-lg font-semibold text-slate-950">{totalItems}</dd>
              </div>
            </dl>
          </DashboardPanel>
          </div>
        </section>
      </div>
    </div>
  );
}
