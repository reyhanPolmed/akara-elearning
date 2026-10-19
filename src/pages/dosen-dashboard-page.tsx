import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { DosenDashboardContent } from "../components/dosen/dosen-dashboard-content";
import { getDosenDashboard } from "../lib/dashboard-api";
import { useApiResource } from "../lib/use-api-resource";

export function DosenDashboardPage() {
  const { data: dashboard, error, loading, reload } = useApiResource(getDosenDashboard);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat dashboard dosen" />
      </AppShell>
    );
  }

  if (error || !dashboard) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Response dashboard kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DosenDashboardContent dashboard={dashboard} />
    </AppShell>
  );
}
