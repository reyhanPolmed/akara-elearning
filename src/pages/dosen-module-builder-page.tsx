import { useParams } from "react-router-dom";

import { AppShell } from "../components/app-shell";
import { DosenModuleBuilder } from "../components/dosen/dosen-module-builder";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import {
  createDosenLesson,
  createDosenQuiz,
  createDosenSection,
  createDosenTask,
  deleteDosenLesson,
  deleteDosenQuiz,
  deleteDosenSection,
  deleteDosenTask,
  getDosenModule,
  updateDosenLesson,
  updateDosenLessonStatus,
  updateDosenQuiz,
  updateDosenQuizStatus,
  updateDosenSection,
  updateDosenTask,
  updateDosenTaskStatus,
} from "../lib/learning-api";
import { useApiResource } from "../lib/use-api-resource";

export function DosenModuleBuilderPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { data: module, error, loading, reload } = useApiResource(
    () => getDosenModule(moduleId ?? ""),
    [moduleId]
  );

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat builder mata kuliah" />
      </AppShell>
    );
  }

  if (error || !module) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Data mata kuliah tidak ditemukan."} onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DosenModuleBuilder
        module={module}
        onCreateSection={createDosenSection}
        onCreateLesson={createDosenLesson}
        onCreateQuiz={createDosenQuiz}
        onCreateTask={createDosenTask}
        onUpdateSection={updateDosenSection}
        onDeleteSection={deleteDosenSection}
        onUpdateLesson={updateDosenLesson}
        onUpdateLessonStatus={updateDosenLessonStatus}
        onDeleteLesson={deleteDosenLesson}
        onUpdateQuiz={updateDosenQuiz}
        onUpdateQuizStatus={updateDosenQuizStatus}
        onDeleteQuiz={deleteDosenQuiz}
        onUpdateTask={updateDosenTask}
        onUpdateTaskStatus={updateDosenTaskStatus}
        onDeleteTask={deleteDosenTask}
        onReload={reload}
      />
    </AppShell>
  );
}
