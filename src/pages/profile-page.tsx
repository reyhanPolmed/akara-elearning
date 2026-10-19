import { type ComponentProps, type FormEvent, useState } from "react";

import { AppShell } from "../components/app-shell";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "../components/dashboard/dashboard-state";
import {
  LearningPageHeader,
  LearningWorkspace,
  learningPanelClassName,
} from "../components/mahasiswa/learning-workspace";
import { roleLabels } from "../lib/auth";
import { useAuth } from "../lib/auth-context";
import {
  changeMahasiswaPassword,
  getMahasiswaProfile,
  updateMahasiswaProfile,
} from "../lib/learning-api";
import { cn } from "../lib/utils";
import { useApiResource } from "../lib/use-api-resource";

type FeedbackState = {
  message: string;
  tone: "error" | "success";
};

type ProfileInputProps = ComponentProps<"input"> & {
  label: string;
};

const inputClassName =
  "w-full rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#a3a3a3] focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[#737373]";

function ProfileInput({ label, ...props }: ProfileInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input className={inputClassName} {...props} />
    </label>
  );
}

export function ProfilePage() {
  const { user } = useAuth();

  if (user?.activeRole !== "mahasiswa") {
    return (
      <AppShell>
        <LearningWorkspace>
          <LearningPageHeader
            description="Profil operasional yang dapat diedit saat ini tersedia untuk mahasiswa. Informasi akun dosen tetap ditampilkan dari sesi aktif."
            eyebrow="Profil akun"
            meta={
              <>
                <span>{user?.email ?? "Email belum tersedia"}</span>
                <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
                <span>{user ? roleLabels[user.activeRole] : "Role belum tersedia"}</span>
              </>
            }
            title={user?.name ?? "Akun"}
          />
        </LearningWorkspace>
      </AppShell>
    );
  }

  return <MahasiswaProfileContent />;
}

function MahasiswaProfileContent() {
  const { data: profile, error, loading, reload } = useApiResource(getMahasiswaProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (loading) {
    return (
      <AppShell>
        <DashboardLoadingState title="Memuat profil mahasiswa" />
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <DashboardErrorState message={error ?? "Profil kosong."} onRetry={reload} />
      </AppShell>
    );
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setSavingProfile(true);
    setFeedback(null);

    try {
      await updateMahasiswaProfile({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        bio: String(formData.get("bio") ?? ""),
      });
      setFeedback({ message: "Profil berhasil diperbarui.", tone: "success" });
      reload();
    } catch (caught) {
      setFeedback({
        message: caught instanceof Error ? caught.message : "Gagal memperbarui profil.",
        tone: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingPassword(true);
    setFeedback(null);

    try {
      await changeMahasiswaPassword(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFeedback({ message: "Password berhasil diubah.", tone: "success" });
    } catch (caught) {
      setFeedback({
        message: caught instanceof Error ? caught.message : "Gagal mengganti password.",
        tone: "error",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell>
      <LearningWorkspace>
        <LearningPageHeader
          description="Kelola informasi dasar akun dan keamanan tanpa mencampurnya dengan data akademik yang dikunci oleh sistem."
          eyebrow="Profil mahasiswa"
          meta={
            <>
              <span>NIM/NISN {profile.nisn ?? "-"}</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>{profile.className || "Kelas belum tersedia"}</span>
              <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
              <span>{profile.department || "Departemen belum tersedia"}</span>
            </>
          }
          title={profile.fullName}
        />

        {feedback ? (
          <div
            aria-live="polite"
            className={cn(
              "rounded-[10px] border px-4 py-3 text-sm",
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            )}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section className={`${learningPanelClassName} p-6 sm:p-8`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
              Informasi akun
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
              Data pribadi
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#737373]">
              Nama, email, nomor telepon, dan bio dapat diperbarui dari formulir ini.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleProfileSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <ProfileInput defaultValue={profile.fullName} label="Nama" name="fullName" required />
                <ProfileInput defaultValue={profile.email} label="Email" name="email" required type="email" />
              </div>

              <ProfileInput
                autoComplete="tel"
                defaultValue={profile.phone ?? ""}
                label="No. Telepon"
                name="phone"
                type="tel"
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bio</span>
                <textarea
                  className={`${inputClassName} min-h-36 resize-y`}
                  defaultValue={profile.bio ?? ""}
                  maxLength={500}
                  name="bio"
                />
                <span className="mt-2 block text-xs text-[#737373]">Maksimal 500 karakter.</span>
              </label>

              <button
                className="min-h-11 rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingProfile}
                type="submit"
              >
                {savingProfile ? "Menyimpan..." : "Simpan profil"}
              </button>
            </form>
          </section>

          <section className={`${learningPanelClassName} p-6 sm:p-8`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
              Keamanan akun
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0a0a]">
              Ganti password
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#737373]">
              Password baru minimal delapan karakter dan harus sama dengan konfirmasi.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handlePasswordSubmit}>
              {[
                ["currentPassword", "Password saat ini", "current-password"],
                ["newPassword", "Password baru", "new-password"],
                ["confirmPassword", "Konfirmasi password baru", "new-password"],
              ].map(([field, label, autoComplete]) => (
                <ProfileInput
                  autoComplete={autoComplete}
                  key={field}
                  label={label}
                  minLength={field === "currentPassword" ? 1 : 8}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  required
                  type="password"
                  value={passwordForm[field as keyof typeof passwordForm]}
                />
              ))}

              <button
                className="inline-flex min-h-11 items-center rounded-[10px] bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingPassword}
                type="submit"
              >
                {savingPassword ? "Memproses..." : "Ubah password"}
              </button>
            </form>

            <div className="mt-8 border-t border-[#e5e5e5] pt-6 text-xs leading-6 text-[#737373]">
              Gunakan password yang berbeda dari akun lain dan jangan membagikannya kepada siapa pun.
            </div>
          </section>
        </div>
      </LearningWorkspace>
    </AppShell>
  );
}
