import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const profileUpdateSchema = z
  .union([
    z.object({
      fullName: z.string().min(2, "Nama minimal 2 karakter"),
      email: z.string().email("Email tidak valid"),
      phone: z.string().min(8).max(24).optional().or(z.literal("")),
      bio: z.string().max(500).optional().or(z.literal("")),
    }),
    z.object({
      name: z.string().min(2, "Nama minimal 2 karakter"),
      email: z.string().email("Email tidak valid"),
      phone: z.string().min(8).max(24).optional().or(z.literal("")),
      bio: z.string().max(500).optional().or(z.literal("")),
    }),
  ])
  .transform((value) => {
    const fullName = "fullName" in value ? value.fullName : value.name;
    return { fullName, email: value.email, phone: value.phone, bio: value.bio };
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });
