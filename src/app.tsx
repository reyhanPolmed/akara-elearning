import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/protected-route";
import { AuthProvider } from "./lib/auth-context";
import { DosenDashboardPage } from "./pages/dosen-dashboard-page";
import { DosenModuleBuilderPage } from "./pages/dosen-module-builder-page";
import { DosenModulesPage } from "./pages/dosen-modules-page";
import {
  DosenReviewKuisClassPage,
  DosenReviewKuisAttemptPage,
  DosenReviewKuisSubjectPage,
} from "./pages/dosen-review-kuis-flow-pages";
import { DosenReviewKuisPage } from "./pages/dosen-review-kuis-page";
import {
  DosenReviewTugasAssignmentPage,
  DosenReviewTugasClassPage,
  DosenReviewTugasIntegrityCheckPage,
  DosenReviewTugasSubmissionPage,
  DosenReviewTugasSubjectPage,
} from "./pages/dosen-review-tugas-flow-pages";
import { DosenReviewTugasPage } from "./pages/dosen-review-tugas-page";
import { LoginPage } from "./pages/login-page";
import { MahasiswaDashboardPage } from "./pages/mahasiswa-dashboard-page";
import { MahasiswaLessonDetailPage } from "./pages/mahasiswa-lesson-detail-page";
import { MahasiswaModuleDetailPage } from "./pages/mahasiswa-module-detail-page";
import { MahasiswaModulesPage } from "./pages/mahasiswa-modules-page";
import { MahasiswaQuizDetailPage } from "./pages/mahasiswa-quiz-detail-page";
import { MahasiswaSchedulePage } from "./pages/mahasiswa-schedule-page";
import { MahasiswaTaskDetailPage } from "./pages/mahasiswa-task-detail-page";
import { MahasiswaTasksPage } from "./pages/mahasiswa-tasks-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProfilePage } from "./pages/profile-page";
import { RoleSelectionPage } from "./pages/role-selection-page";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/pilih-peran"
          element={
            <ProtectedRoute>
              <RoleSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mahasiswa/dashboard"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/modul"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaModulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/modul/:moduleId"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaModuleDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/materi/:lessonId"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaLessonDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/tugas"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/tugas/:taskId"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaTaskDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/kuis/:quizId"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaQuizDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mahasiswa/jadwal"
          element={
            <ProtectedRoute role="mahasiswa">
              <MahasiswaSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/dashboard"
          element={
            <ProtectedRoute role="dosen">
              <DosenDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/mata-kuliah"
          element={
            <ProtectedRoute role="dosen">
              <DosenModulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/mata-kuliah/:moduleId/builder"
          element={
            <ProtectedRoute role="dosen">
              <DosenModuleBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-tugas"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewTugasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-tugas/kelas/:kelasId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewTugasClassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-tugas/kelas/:kelasId/mata-kuliah/:mataKuliahId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewTugasSubjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-tugas/kelas/:kelasId/mata-kuliah/:mataKuliahId/tugas/:tugasId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewTugasAssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-tugas/kelas/:kelasId/mata-kuliah/:mataKuliahId/tugas/:tugasId/pengumpulan/:submissionId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewTugasSubmissionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-tugas/kelas/:kelasId/mata-kuliah/:mataKuliahId/tugas/:tugasId/pengumpulan/:submissionId/integrity-check"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewTugasIntegrityCheckPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-kuis"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewKuisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-kuis/kelas/:kelasId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewKuisClassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-kuis/kelas/:kelasId/mata-kuliah/:mataKuliahId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewKuisSubjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dosen/review-kuis/kelas/:kelasId/mata-kuliah/:mataKuliahId/attempt/:attemptId"
          element={
            <ProtectedRoute role="dosen">
              <DosenReviewKuisAttemptPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
