import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import { MahasiswaDashboardContent } from "../components/mahasiswa/mahasiswa-dashboard-content";
import { useAuth } from "../lib/auth-context";
import { getMahasiswaDashboard } from "../lib/dashboard-api";
import { useApiResource } from "../lib/use-api-resource";

export function MahasiswaDashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, error, loading, reload } = useApiResource(getMahasiswaDashboard);

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat dashboard mahasiswa" />
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
      <MahasiswaDashboardContent dashboard={dashboard} fallbackName={user?.name} />
    </AppShell>
  );
}
