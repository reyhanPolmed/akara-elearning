import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import { FileCheckIcon } from "../components/dashboard/dashboard-icons";
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
import { formatDateTime, formatPercent } from "../lib/format";
import {
  getMahasiswaTask,
  submitMahasiswaTask,
  type MahasiswaTaskDetail,
  type TaskSubmitPayload,
} from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("File tidak dapat dibaca"));
        return;
      }

      const [, base64Data = ""] = result.split(",", 2);
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("File tidak dapat dibaca"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return null;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getFileKindLabel(fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toUpperCase();
  if (extension) return extension;
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word")) return "DOCX";
  if (mimeType.startsWith("image/")) return "GAMBAR";
  return "FILE";
}

function isPdfAttachment(mimeType: string, url: string) {
  return mimeType === "application/pdf" || url.toLowerCase().endsWith(".pdf");
}

function isImageAttachment(mimeType: string) {
  return mimeType.startsWith("image/");
}

function getSubmitMethodLabel(method: MahasiswaTaskDetail["submitMethod"]) {
  if (method === "file") return "File";
  if (method === "file_link") return "File + Link";
  return "Link";
}

export function MahasiswaTaskDetailPage() {
  const { taskId } = useParams();
  const { data: task, error, loading, reload } = useApiResource(
    () => getMahasiswaTask(taskId ?? ""),
    [taskId]
  );
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionFile, setSubmissionFile] = useState<TaskSubmitPayload["submissionFile"]>();
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (task?.currentSubmission?.link) {
      setSubmissionLink(task.currentSubmission.link);
    }
  }, [task?.id, task?.currentSubmission?.link]);

  if (!taskId) {
    return (
      <AppShell>
        <DashboardErrorState message="ID tugas tidak valid." onRetry={reload} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat detail tugas" />
      </AppShell>
    );
  }

  if (error || !task) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Detail tugas kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const submitMethod = task.submitMethod ?? "link";
  const requiresLink = submitMethod === "link" || submitMethod === "file_link";
  const requiresFile = submitMethod === "file" || submitMethod === "file_link";
  const hasSubmitted = Boolean(task.currentSubmission);
  const canSubmit = !hasSubmitted || task.allowRevision;
  const selectedFileLabel = submissionFile?.fileName ?? task.currentSubmission?.file?.fileName ?? null;
  const selectedFileMimeType =
    submissionFile?.mimeType ?? task.currentSubmission?.file?.mimeType ?? "application/octet-stream";
  const originality = task.currentSubmission?.originalityCheck;

  async function handleFileSelection(file?: File | null) {
    if (!file) return;

    const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      setSubmitError("Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    const maxFileSizeInBytes = 8 * 1024 * 1024;
    if (file.size > maxFileSizeInBytes) {
      setSubmitError("Ukuran file terlalu besar. Maksimal 8MB agar aman untuk upload backend.");
      return;
    }

    setSubmitError("");
    setSubmissionFile({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      base64Data: await readFileAsBase64(file),
    });
    setSelectedFileSize(file.size);
  }

  async function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    await handleFileSelection(event.target.files?.[0]);
  }

  async function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!canSubmit) return;
    await handleFileSelection(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskId) return;

    const trimmedLink = submissionLink.trim();

    setSubmitError("");
    setSubmitSuccess("");

    if (requiresLink && !trimmedLink) {
      setSubmitError("Link submission wajib diisi.");
      return;
    }

    if (requiresFile && !submissionFile) {
      setSubmitError("File submission wajib diunggah.");
      return;
    }

    setSubmitting(true);
    try {
      await submitMahasiswaTask(taskId, {
        submissionLink: trimmedLink || undefined,
        submissionFile,
      });
      setSubmitSuccess("Submission berhasil dikirim.");
      reload();
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Gagal mengirim tugas.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <LearningWorkspace wide>
        <LearningBreadcrumb current={task.title} href={`/mahasiswa/modul/${task.courseId}`} />

        <LearningPageHeader
          description={task.description || "Deskripsi tugas belum tersedia."}
          eyebrow="Tugas"
          meta={
            <>
              <span>Deadline {formatDateTime(task.dueAt)}</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>Metode {getSubmitMethodLabel(submitMethod)}</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>Revisi {task.allowRevision ? "diizinkan" : "tidak diizinkan"}</span>
            </>
          }
          title={task.title}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {task.attachment ? (
            <section className={`${learningPanelClassName} p-6 sm:p-8`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Lampiran soal</p>
                  <p className="mt-2 font-medium text-[#0a0a0a]">{task.attachment.fileName}</p>
                </div>
                <a
                  className="inline-flex min-h-10 items-center rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                  href={task.attachment.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Buka file
                </a>
              </div>

              <div className="mt-5">
                {isPdfAttachment(task.attachment.mimeType, task.attachment.url) ? (
                  <iframe
                    className="h-[680px] w-full rounded-[10px] border border-[#e5e5e5] bg-white"
                    src={task.attachment.url}
                    title={task.attachment.fileName}
                  />
                ) : isImageAttachment(task.attachment.mimeType) ? (
                  <img
                    alt={task.attachment.fileName}
                    className="max-h-[680px] w-full rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] object-contain"
                    src={task.attachment.url}
                  />
                ) : (
                  <div className="rounded-[10px] border border-dashed border-[#d4d4d4] bg-[#fafafa] p-5 text-sm leading-6 text-slate-600">
                    File soal tersedia untuk diunduh melalui tombol buka file.
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className={`${learningPanelClassName} p-6 sm:p-8`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Submission</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
              Pengumpulan tugas
            </h2>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {requiresLink ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Link submission</span>
                  <input
                    className="w-full rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-[#fafafa] disabled:opacity-70"
                    disabled={!canSubmit}
                    onChange={(event) => setSubmissionLink(event.target.value)}
                    placeholder="https://drive.google.com/..."
                    required={requiresLink}
                    type="url"
                    value={submissionLink}
                  />
                </label>
              ) : null}

              {requiresFile ? (
                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">File submission</span>
                  <div
                    className="overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white"
                    onDragEnter={(event) => {
                      event.preventDefault();
                      if (canSubmit) setDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setDragging(false);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleFileDrop}
                  >
                    <input
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      disabled={!canSubmit}
                      onChange={handleFileInputChange}
                      type="file"
                    />
                    <div
                      className={cn(
                        "m-4 rounded-[10px] border border-dashed px-6 py-8 text-center transition",
                        dragging ? "border-[#171717] bg-[#fafafa]" : "border-[#d4d4d4] bg-white"
                      )}
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white">
                        <FileCheckIcon className="h-6 w-6 text-[#171717]" />
                      </div>
                      <p className="mt-5 text-[20px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">
                        Tarik dan lepaskan file di sini
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Format: PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP. Maksimal 8MB.
                      </p>
                      <button
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#171717] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canSubmit}
                        onClick={(event) => {
                          event.preventDefault();
                          fileInputRef.current?.click();
                        }}
                        type="button"
                      >
                        Pilih file
                      </button>
                    </div>

                    {selectedFileLabel ? (
                      <div className="border-t border-slate-200 px-5 py-4">
                        <p className="text-sm font-medium text-slate-600">File terpilih</p>
                        <div className="mt-4 flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa]">
                            <FileCheckIcon className="h-6 w-6 text-slate-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-medium text-slate-950">{selectedFileLabel}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span>{getFileKindLabel(selectedFileLabel, selectedFileMimeType)}</span>
                              {formatFileSize(selectedFileSize) ? (
                                <span>| {formatFileSize(selectedFileSize)}</span>
                              ) : null}
                              {hasSubmitted ? <span>| tersimpan</span> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                  {submitSuccess}
                </div>
              ) : null}

              {hasSubmitted && !task.allowRevision ? (
                <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Tugas sudah dikumpulkan. Revisi tidak diizinkan untuk tugas ini.
                </div>
              ) : null}

              <button
                className="min-h-11 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || !canSubmit}
                type="submit"
              >
                {!canSubmit ? "Tugas sudah dikumpulkan" : submitting ? "Mengirim..." : "Kirim tugas"}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-8">
          <section className={`${learningPanelClassName} p-5 sm:p-6`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Submission saat ini</p>
            {task.currentSubmission ? (
              <div className="mt-4 space-y-4">
                <StatusBadge tone="success">{task.currentSubmission.status}</StatusBadge>
                <p className="text-sm text-slate-600">
                  Dikirim pada {formatDateTime(task.currentSubmission.submittedAt)}
                </p>
                {originality ? (
                  <div className="border-t border-[#e5e5e5] pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Indeks kemiripan
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0a0a]">
                      {formatPercent(originality.maxSimilarity)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{originality.status}</p>
                  </div>
                ) : null}
                {task.currentSubmission.file ? (
                  <a
                    className="inline-flex min-h-10 items-center rounded-[10px] border border-[#e5e5e5] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                    href={task.currentSubmission.file.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Buka file submission
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">Belum ada submission.</p>
            )}
          </section>

          <LearningOutline
            activeItem={{
              id: task.id,
              type: "task",
            }}
            items={task.sidebar}
          />
        </aside>
        </div>
      </LearningWorkspace>
    </AppShell>
  );
}
