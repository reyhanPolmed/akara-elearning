import { z } from "zod";

const submissionFileSchema = z.object({
  fileName: z.string().min(1, "Nama file wajib diisi"),
  mimeType: z.string().min(1, "Tipe file wajib diisi"),
  base64Data: z.string().min(1, "Konten file wajib diisi"),
});

export const taskSubmitSchema = z
  .union([
    z
      .object({
        submissionLink: z.string().url("Link submission harus URL valid").optional(),
        submissionFile: submissionFileSchema.optional(),
      })
      .refine((value) => Boolean(value.submissionLink || value.submissionFile), {
        message: "Minimal kirim link atau file submission",
      }),
    z
      .object({
        submission_link: z.string().url("Link submission harus URL valid").optional(),
        submission_file: submissionFileSchema.optional(),
      })
      .refine((value) => Boolean(value.submission_link || value.submission_file), {
        message: "Minimal kirim link atau file submission",
      }),
  ])
  .transform((value) => {
    const normalized = value as {
      submissionLink?: string;
      submissionFile?: {
        fileName: string;
        mimeType: string;
        base64Data: string;
      };
      submission_link?: string;
      submission_file?: {
        fileName: string;
        mimeType: string;
        base64Data: string;
      };
    };

    return {
      submissionLink: normalized.submissionLink ?? normalized.submission_link,
      submissionFile: normalized.submissionFile ?? normalized.submission_file,
    };
  });
