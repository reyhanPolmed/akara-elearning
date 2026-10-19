import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import { EmptyState } from "../components/dashboard/empty-state";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import {
  ReviewCardGrid,
  ReviewFlowHeader,
  ReviewSection,
  ReviewWorkspace,
} from "../components/dosen/review-flow";
import { TaskIntegrityCheckView } from "../components/dosen/task-integrity-check-view";
import { TaskReviewSubmissionDetail } from "../components/dosen/task-review-submission-detail";
import { TaskReviewSubmissionsTable } from "../components/dosen/task-review-submissions-table";
import {
  buildTaskAssignmentCards,
  buildTaskSubjectCards,
  decodeReviewSegment,
  encodeReviewSegment,
  filterTaskSubmissions,
  loadTaskReviewRows,
} from "../lib/dosen-review-flow";
import { useApiResource } from "../lib/use-api-resource";

const PAGE_SIZE = 8;

export function DosenReviewTugasClassPage() {
  const { kelasId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const { data: submissions, error, loading, reload } = useApiResource(loadTaskReviewRows);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat mata kuliah kelas" />
      </AppShell>
    );
  }

  if (error || !submissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data mata kuliah kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const subjectCards = buildTaskSubjectCards(submissions, className);

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          backHref="/dosen/review-tugas"
          backLabel="Kembali ke kelas"
          title={`Mata Kuliah ${className}`}
          description="Pilih mata kuliah terlebih dahulu, lalu buka pengumpulan tugas mahasiswa pada mata kuliah tersebut."
        />

        <ReviewSection title={`Pilih Mata Kuliah - ${className}`}>
          <ReviewCardGrid
            emptyMessage="Belum ada mata kuliah dengan pengumpulan tugas di kelas ini."
            items={subjectCards}
          />
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}

export function DosenReviewTugasSubjectPage() {
  const { kelasId, mataKuliahId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const subjectName = decodeReviewSegment(mataKuliahId);
  const { data: submissions, error, loading, reload } = useApiResource(loadTaskReviewRows);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat daftar tugas" />
      </AppShell>
    );
  }

  if (error || !submissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data tugas kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const assignmentCards = buildTaskAssignmentCards(submissions, className, subjectName);

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          backHref={`/dosen/review-tugas/kelas/${encodeReviewSegment(className)}`}
          backLabel="Kembali ke mata kuliah"
          title={`Tugas ${subjectName}`}
          description="Pilih tugas terlebih dahulu agar dosen masuk ke daftar pengumpulan yang lebih fokus."
        />

        <ReviewSection
          title={`Pilih Tugas - ${className}`}
          description="Setiap card merangkum satu tugas beserta volume pengumpulan, rata-rata nilai, dan antrean review."
        >
          <ReviewCardGrid
            emptyMessage="Belum ada tugas dengan pengumpulan pada mata kuliah ini."
            items={assignmentCards}
          />
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}

export function DosenReviewTugasAssignmentPage() {
  const { kelasId, mataKuliahId, tugasId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const subjectName = decodeReviewSegment(mataKuliahId);
  const taskId = decodeReviewSegment(tugasId);
  const { data: allSubmissions, error, loading, reload } = useApiResource(loadTaskReviewRows);
  const [currentPage, setCurrentPage] = useState(1);

  const submissions = useMemo(
    () =>
      allSubmissions
        ? filterTaskSubmissions(allSubmissions, className, subjectName, taskId)
        : [],
    [allSubmissions, className, subjectName, taskId]
  );
  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (activePage - 1) * PAGE_SIZE;
    return submissions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [activePage, submissions]);
  const taskTitle = submissions[0]?.taskTitle ?? (decodeReviewSegment(tugasId) || "Tugas");

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat pengumpulan tugas" />
      </AppShell>
    );
  }

  if (error || !allSubmissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data pengumpulan kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          backHref={`/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}`}
          backLabel="Kembali ke tugas"
          title={`Pengumpulan ${taskTitle}`}
          description="Pilih submission mahasiswa dari tugas yang sama agar proses review lebih fokus dan rapi."
        />

        <ReviewSection
          title={`Daftar Pengumpulan - ${className}`}
          contentClassName="p-0 sm:p-0"
        >
          {submissions.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                title="Belum ada pengumpulan untuk tugas ini"
                description="Daftar submission akan muncul di sini setelah mahasiswa mengirimkan tugas yang dipilih."
              />
            </div>
          ) : (
            <TaskReviewSubmissionsTable
              className={className}
              subjectName={subjectName}
              taskTitle={taskTitle}
              submissions={paginatedSubmissions}
              totalCount={submissions.length}
              currentPage={activePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              buildDetailHref={(submissionId) =>
                `/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}/tugas/${encodeReviewSegment(taskId)}/pengumpulan/${submissionId}`
              }
              buildIntegrityHref={(submissionId) =>
                `/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}/tugas/${encodeReviewSegment(taskId)}/pengumpulan/${submissionId}/integrity-check`
              }
            />
          )}
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}

export function DosenReviewTugasSubmissionPage() {
  const { kelasId, mataKuliahId, tugasId, submissionId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const subjectName = decodeReviewSegment(mataKuliahId);
  const taskId = decodeReviewSegment(tugasId);
  const resolvedSubmissionId = submissionId ?? "";
  const baseHref = `/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}/tugas/${encodeReviewSegment(taskId)}`;

  return (
    <AppShell>
      <TaskReviewSubmissionDetail
        submissionId={resolvedSubmissionId}
        backHref={baseHref}
        integrityHref={`${baseHref}/pengumpulan/${resolvedSubmissionId}/integrity-check`}
      />
    </AppShell>
  );
}

export function DosenReviewTugasIntegrityCheckPage() {
  const { kelasId, mataKuliahId, tugasId, submissionId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const subjectName = decodeReviewSegment(mataKuliahId);
  const taskId = decodeReviewSegment(tugasId);
  const resolvedSubmissionId = submissionId ?? "";

  return (
    <AppShell fullWidth hideSidebar>
      <TaskIntegrityCheckView
        taskId={taskId}
        submissionId={resolvedSubmissionId}
        backHref={`/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}/tugas/${encodeReviewSegment(taskId)}`}
      />
    </AppShell>
  );
}
