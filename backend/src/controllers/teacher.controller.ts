import type { Request, Response } from "express";
import { z } from "zod";
import {
  getQuizAttemptDetail,
  getTaskSubmissionDetail,
  gradeQuizAttempt,
  gradeTaskSubmission,
  listQuizSubmissions,
  listTaskSubmissions,
} from "../services/teacher-review.service.js";
import {
  getTeacherModuleDetail,
  listTeacherModules,
} from "../services/teacher-module.service.js";
import {
  getStudentProgressDetail,
  listStudentProgress,
} from "../services/teacher-progress.service.js";
import { idParamSchema } from "../validators/common.validator.js";

// ─── Module ──────────────────────────────────────────────────────────────────

export async function listModulesTeacherController(
  request: Request,
  response: Response
) {
  const modules = await listTeacherModules(request.authUser!.id);
  response.json(modules);
}

export async function getModuleTeacherController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const detail = await getTeacherModuleDetail(id, request.authUser!.id);
  response.json(detail);
}

// ─── Task Submissions ────────────────────────────────────────────────────────

export async function listTaskSubmissionsController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const { classId, status } = request.query as {
    classId?: string;
    status?: string;
  };
  const submissions = await listTaskSubmissions(id, request.authUser!.id, {
    classId,
    status,
  });
  response.json(submissions);
}

export async function getTaskSubmissionDetailController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const detail = await getTaskSubmissionDetail(id, request.authUser!.id);
  response.json(detail);
}

const gradeTaskSchema = z.object({
  score: z.number().int().min(0).max(100).optional(),
  rubricScores: z.array(
    z.object({
      rubricId: z.string(),
      score: z.number().int().min(0),
    })
  ).optional(),
  teacherFeedback: z.string().optional(),
  action: z.enum(["draft", "revision", "publish"]),
}).refine((payload) => payload.score !== undefined || (payload.rubricScores?.length ?? 0) > 0, {
  message: "Nilai wajib diisi",
  path: ["score"],
});

export async function gradeTaskSubmissionController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const payload = gradeTaskSchema.parse(request.body);
  const result = await gradeTaskSubmission(id, request.authUser!.id, payload);
  response.json(result);
}

// ─── Quiz Attempts ────────────────────────────────────────────────────────────

export async function listQuizSubmissionsController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const { status, scope } = request.query as { status?: string; scope?: string };
  const submissions = await listQuizSubmissions(id, request.authUser!.id, {
    status,
    scope,
  });
  response.json(submissions);
}

export async function getQuizAttemptDetailController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const detail = await getQuizAttemptDetail(id, request.authUser!.id);
  response.json(detail);
}

const gradeQuizSchema = z.object({
  action: z.enum(["draft", "publish", "retake"]),
  score: z.number().int().min(0).max(100).optional(),
});

export async function gradeQuizAttemptController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  const payload = gradeQuizSchema.parse(request.body);
  const result = await gradeQuizAttempt(id, request.authUser!.id, payload);
  response.json(result);
}

// ─── Progress ────────────────────────────────────────────────────────────────

export async function listStudentProgressController(
  request: Request,
  response: Response
) {
  const { moduleStudentClassId, riskLevel } = request.query as {
    moduleStudentClassId?: string;
    riskLevel?: string;
  };
  const progress = await listStudentProgress(request.authUser!.id, {
    moduleStudentClassId,
    riskLevel,
  });
  response.json(progress);
}

const progressDetailParamSchema = z.object({
  offeringId: z.string(),
  studentId: z.string(),
});

export async function getStudentProgressDetailController(
  request: Request,
  response: Response
) {
  const { offeringId, studentId } = progressDetailParamSchema.parse(
    request.params
  );
  const detail = await getStudentProgressDetail(
    offeringId,
    studentId,
    request.authUser!.id
  );
  response.json(detail);
}
