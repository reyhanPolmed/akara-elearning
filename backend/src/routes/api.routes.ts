import { Router } from "express";

import { getCurrentUserController } from "../controllers/auth.controller.js";
import { getDashboardController } from "../controllers/dashboard.controller.js";
import {
  completeLessonController,
  getLessonController,
  trackLessonDurationController
} from "../controllers/lesson.controller.js";
import {
  getModuleController,
  listCoursesController,
  listModulesController
} from "../controllers/module.controller.js";
import {
  changePasswordController,
  updateProfileController
} from "../controllers/profile.controller.js";
import {
  getQuizController,
  getQuizResultController,
  saveQuizAttemptController,
  startQuizController,
  submitQuizController
} from "../controllers/quiz.controller.js";
import { getTaskController, submitTaskController } from "../controllers/task.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createApiRouter() {
  const router = Router();

  router.use(asyncHandler(authMiddleware));

  router.get("/user", asyncHandler(getCurrentUserController));
  router.get("/dashboard", asyncHandler(getDashboardController));
  router.get("/modules", asyncHandler(listModulesController));
  router.get("/modules/:id", asyncHandler(getModuleController));
  router.get("/courses", asyncHandler(listCoursesController));
  router.get("/lessons/:id", asyncHandler(getLessonController));
  router.post("/lessons/:id/duration", asyncHandler(trackLessonDurationController));
  router.post("/lessons/:id/complete", asyncHandler(completeLessonController));
  router.get("/quizzes/:id", asyncHandler(getQuizController));
  router.post("/quizzes/:id/start", asyncHandler(startQuizController));
  router.put("/quizzes/:id/attempt", asyncHandler(saveQuizAttemptController));
  router.post("/quizzes/:id/submit", asyncHandler(submitQuizController));
  router.get("/quizzes/:id/result", asyncHandler(getQuizResultController));
  router.get("/tasks/:id", asyncHandler(getTaskController));
  router.post("/tasks/:id/submit", asyncHandler(submitTaskController));
  router.put("/profile", asyncHandler(updateProfileController));
  router.post("/profile/change-password", asyncHandler(changePasswordController));

  return router;
}
