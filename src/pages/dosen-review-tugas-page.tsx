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
import { buildTaskClassCards, loadTaskReviewRows } from "../lib/dosen-review-flow";
import { useApiResource } from "../lib/use-api-resource";

export function DosenReviewTugasPage() {
  const { data: submissions, error, loading, reload } = useApiResource(loadTaskReviewRows);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat review tugas" />
      </AppShell>
    );
  }

  if (error || !submissions) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data review tugas kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  const classCards = buildTaskClassCards(submissions);

  return (
    <AppShell>
      <ReviewWorkspace>
        <ReviewFlowHeader
          title="Review Tugas Mahasiswa"
          description="Pilih kelas untuk meninjau pengumpulan tugas, feedback revisi, dan status penilaian."
        />

        <ReviewSection
          title="Pilih Kelas"
          description="Daftar ini membantu dosen masuk ke antrean tugas berdasarkan kelas."
        >
          <ReviewCardGrid
            emptyMessage="Belum ada pengumpulan tugas. Kelas akan muncul setelah mahasiswa mengirimkan tugas."
            items={classCards}
          />
        </ReviewSection>
      </ReviewWorkspace>
    </AppShell>
  );
}
