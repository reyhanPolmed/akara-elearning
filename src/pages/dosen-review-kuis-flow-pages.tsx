import { useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { QuizAttemptReviewDetail } from "../components/dosen/quiz-attempt-review-detail";
import { QuizReviewSubmissionsTable } from "../components/dosen/quiz-review-submissions-table";
import {
  ReviewCardGrid,
  ReviewFlowHeader,
  ReviewSection,
  ReviewWorkspace,
} from "../components/dosen/review-flow";
import {
  buildQuizSubjectCards,
  decodeReviewSegment,
  encodeReviewSegment,
  filterQuizSubmissions,
} from "../lib/dosen-review-flow";
import { listDosenQuizSubmissions, listDosenQuizzes } from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

async function loadQuizSubmissions() {
  const quizzes = await listDosenQuizzes();
  const rows = await Promise.all(quizzes.map((quiz) => listDosenQuizSubmissions(quiz.id)));
  return rows.flat();
}

export function DosenReviewKuisClassPage() {
  const { kelasId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const { data: submissions, error, loading, reload } = useApiResource(loadQuizSubmissions);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat mata kuliah kuis" />
      </AppShell>
    );
  }

  if (error || !submissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data mata kuliah kuis kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const subjectCards = buildQuizSubjectCards(submissions, className);

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          backHref="/dosen/review-kuis"
          backLabel="Kembali ke kelas"
          title={`Mata Kuliah ${className}`}
          description="Pilih mata kuliah, kemudian buka daftar attempt kuis mahasiswa yang perlu ditinjau."
        />

        <ReviewSection title={`Pilih Mata Kuliah - ${className}`}>
          <ReviewCardGrid
            emptyMessage="Belum ada mata kuliah dengan pengumpulan kuis di kelas ini."
            items={subjectCards}
          />
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}

export function DosenReviewKuisSubjectPage() {
  const { kelasId, mataKuliahId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const subjectName = decodeReviewSegment(mataKuliahId);
  const { data: submissions, error, loading, reload } = useApiResource(loadQuizSubmissions);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat pengumpulan kuis" />
      </AppShell>
    );
  }

  if (error || !submissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data pengumpulan kuis kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const filteredSubmissions = filterQuizSubmissions(submissions, className, subjectName);

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          backHref={`/dosen/review-kuis/kelas/${encodeReviewSegment(className)}`}
          backLabel="Kembali ke mata kuliah"
          title={`Pengumpulan ${subjectName}`}
          description="Pilih salah satu attempt kuis untuk meninjau jawaban, skor, dan tindak lanjut mahasiswa."
        />

        <ReviewSection
          title={`Daftar Pengumpulan - ${className}`}
          description={`${subjectName} · ${filteredSubmissions.length} pengumpulan kuis`}
          contentClassName="p-0 sm:p-0"
        >
          <QuizReviewSubmissionsTable
            submissions={filteredSubmissions}
            buildDetailHref={(submissionId) =>
              `/dosen/review-kuis/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}/attempt/${submissionId}`
            }
          />
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}

export function DosenReviewKuisAttemptPage() {
  const { kelasId, mataKuliahId, attemptId } = useParams();
  const className = decodeReviewSegment(kelasId);
  const subjectName = decodeReviewSegment(mataKuliahId);
  const resolvedAttemptId = attemptId ?? "";

  return (
    <AppShell>
      <QuizAttemptReviewDetail
        attemptId={resolvedAttemptId}
        backHref={`/dosen/review-kuis/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}`}
      />
    </AppShell>
  );
}
