import { z } from "zod";

export const lessonDurationSchema = z.object({
  seconds: z.coerce.number().int().positive().max(300),
});
