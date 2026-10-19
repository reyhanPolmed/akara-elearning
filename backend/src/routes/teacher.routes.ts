import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { teacherMiddleware } from "../middlewares/teacher.middleware.js";

// Controllers
import { getTeacherDashboardController } from "../controllers/teacher-dashboard.controller.js";
import {
  createLessonController,
  deleteLessonController,
  getLessonTeacherController,
  patchLessonStatusController,
  updateLessonController,
} from "../controllers/teacher-lesson.controller.js";
import {
  createQuizController,
  createQuizBankController,
  deleteQuizController,
  getQuizTeacherController,
  instantiateQuizFromBankController,
  listTeacherQuizBanksController,
  listTeacherQuizzesController,
  patchQuizStatusController,
  updateQuizController,
} from "../controllers/teacher-quiz.controller.js";
import {
  createTaskController,
  deleteTaskController,
  getTaskTeacherController,
  patchTaskStatusController,
  updateTaskController,
} from "../controllers/teacher-task.controller.js";
import {
  getModuleTeacherController,
  getQuizAttemptDetailController,
  getStudentProgressDetailController,
  getTaskSubmissionDetailController,
  gradeQuizAttemptController,
  gradeTaskSubmissionController,
  listModulesTeacherController,
  listQuizSubmissionsController,
  listStudentProgressController,
  listTaskSubmissionsController,
} from "../controllers/teacher.controller.js";
import {
  getTaskSubmissionIntegrityPairDetailController,
  getTaskSubmissionIntegrityPairVisualAssetController,
  getTaskSubmissionIntegrityPairVisualController,
  getTaskSubmissionIntegritySummaryController,
  listTaskSubmissionIntegrityPairsController,
  retryTaskSubmissionIntegrityController,
} from "../controllers/teacher-integrity.controller.js";
import {
  createSectionController,
  deleteSectionController,
  updateSectionController,
} from "../controllers/teacher-section.controller.js";

export function createTeacherRouter() {
  const router = Router();

  // Auth guard untuk semua route guru
  router.use(asyncHandler(teacherMiddleware));

  // ─── Dashboard ───────────────────────────────────────────────────────────
  router.get("/dashboard", asyncHandler(getTeacherDashboardController));

  // ─── Modules ─────────────────────────────────────────────────────────────
  router.get("/modules", asyncHandler(listModulesTeacherController));
  router.get("/modules/:id", asyncHandler(getModuleTeacherController));

  // ─── Sections (Chapters) ─────────────────────────────────────────────────
  router.post("/sections", asyncHandler(createSectionController));
  router.put("/sections/:id", asyncHandler(updateSectionController));
  router.delete("/sections/:id", asyncHandler(deleteSectionController));

  // ─── Lessons ─────────────────────────────────────────────────────────────
  router.post("/lessons", asyncHandler(createLessonController));
  router.get("/lessons/:id", asyncHandler(getLessonTeacherController));
  router.put("/lessons/:id", asyncHandler(updateLessonController));
  router.patch("/lessons/:id/status", asyncHandler(patchLessonStatusController));
  router.delete("/lessons/:id", asyncHandler(deleteLessonController));

  // ─── Quizzes ─────────────────────────────────────────────────────────────
  router.get("/quizzes", asyncHandler(listTeacherQuizzesController));
  router.post("/quizzes", asyncHandler(createQuizController));
  router.get("/quizzes/:id", asyncHandler(getQuizTeacherController));
  router.put("/quizzes/:id", asyncHandler(updateQuizController));
  router.patch("/quizzes/:id/status", asyncHandler(patchQuizStatusController));
  router.delete("/quizzes/:id", asyncHandler(deleteQuizController));
  router.get("/quiz-banks", asyncHandler(listTeacherQuizBanksController));
  router.post("/quiz-banks", asyncHandler(createQuizBankController));
  router.post("/quizzes/from-bank", asyncHandler(instantiateQuizFromBankController));

  // Quiz submissions / review
  router.get("/quizzes/:id/submissions", asyncHandler(listQuizSubmissionsController));

  // ─── Tasks ───────────────────────────────────────────────────────────────
  router.post("/tasks", asyncHandler(createTaskController));
  router.get("/tasks/:id", asyncHandler(getTaskTeacherController));
  router.put("/tasks/:id", asyncHandler(updateTaskController));
  router.patch("/tasks/:id/status", asyncHandler(patchTaskStatusController));
  router.delete("/tasks/:id", asyncHandler(deleteTaskController));

  // Task submissions / review
  router.get("/tasks/:id/submissions", asyncHandler(listTaskSubmissionsController));

  // ─── Reviews ─────────────────────────────────────────────────────────────
  router.get(
    "/task-submissions/:id",
    asyncHandler(getTaskSubmissionDetailController)
  );
  router.put(
    "/task-submissions/:id/grade",
    asyncHandler(gradeTaskSubmissionController)
  );
  router.get(
    "/task-submissions/:id/integrity-summary",
    asyncHandler(getTaskSubmissionIntegritySummaryController)
  );
  router.get(
    "/task-submissions/:id/integrity-pairs",
    asyncHandler(listTaskSubmissionIntegrityPairsController)
  );
  router.get(
    "/task-submissions/:id/integrity-pairs/:comparisonId",
    asyncHandler(getTaskSubmissionIntegrityPairDetailController)
  );
  router.get(
    "/task-submissions/:id/integrity-pairs/:comparisonId/visual",
    asyncHandler(getTaskSubmissionIntegrityPairVisualController)
  );
  router.get(
    "/task-submissions/:id/integrity-pairs/:comparisonId/documents/:side/visual-asset",
    asyncHandler(getTaskSubmissionIntegrityPairVisualAssetController)
  );
  router.post(
    "/task-submissions/:id/integrity-retry",
    asyncHandler(retryTaskSubmissionIntegrityController)
  );

  router.get(
    "/quiz-attempts/:id",
    asyncHandler(getQuizAttemptDetailController)
  );
  router.put(
    "/quiz-attempts/:id/grade",
    asyncHandler(gradeQuizAttemptController)
  );

  // ─── Progress ────────────────────────────────────────────────────────────
  router.get("/progress", asyncHandler(listStudentProgressController));
  router.get(
    "/progress/:offeringId/:studentId",
    asyncHandler(getStudentProgressDetailController)
  );

  return router;
}
