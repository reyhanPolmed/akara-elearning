import { AppShell } from "../components/app-shell";
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
import { buildQuizClassCards } from "../lib/dosen-review-flow";
import { listDosenQuizSubmissions, listDosenQuizzes } from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

async function loadQuizSubmissions() {
  const quizzes = await listDosenQuizzes();
  const rows = await Promise.all(quizzes.map((quiz) => listDosenQuizSubmissions(quiz.id)));
  return rows.flat();
}

export function DosenReviewKuisPage() {
  const { data: submissions, error, loading, reload } = useApiResource(loadQuizSubmissions);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat review kuis" />
      </AppShell>
    );
  }

  if (error || !submissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data review kuis kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const classCards = buildQuizClassCards(submissions);

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          title="Review Kuis Mahasiswa"
          description="Pilih kelas sebagai pintu masuk untuk meninjau hasil kuis dan menentukan tindak lanjut."
        />

        <ReviewSection
          title="Pilih Kelas"
          description="Ringkasan kelas disusun dari attempt kuis yang sudah dikumpulkan mahasiswa."
        >
          <ReviewCardGrid
            emptyMessage="Belum ada pengumpulan kuis. Kelas akan muncul setelah mahasiswa mulai mengerjakan kuis."
            items={classCards}
          />
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}
