import { z } from "zod";

export const quizSubmitSchema = z.object({
  attemptId: z.string(),
  answers: z.record(z.string(), z.string()),
  fullscreenViolation: z.boolean().default(false),
});

export const quizAttemptSaveSchema = z.object({
  attemptId: z.string(),
  answers: z.record(z.string(), z.string()),
});
