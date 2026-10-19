import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import {
  AlertCircleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  LoaderIcon,
  LockIcon,
  MailIcon,
} from "../components/login-icons";
import { resolveInitialRedirect } from "../lib/auth";
import { useAuth } from "../lib/auth-context";

type LocationState = {
  from?: string;
};

function getLoginErrorMessage(error: unknown) {
  const fallbackMessage = "Email atau kata sandi tidak valid.";

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("invalid") ||
    normalizedMessage.includes("credential") ||
    normalizedMessage.includes("password") ||
    normalizedMessage.includes("email")
  ) {
    return fallbackMessage;
  }

  return "Login gagal. Coba lagi.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const state = location.state as LocationState | null;

  if (!loading && user) {
    return <Navigate to={resolveInitialRedirect(user)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      const session = await signIn({ email, password });
      setSuccess(true);
      window.setTimeout(() => {
        navigate(state?.from ?? resolveInitialRedirect(session), { replace: true });
      }, 700);
    } catch (caught) {
      setError(getLoginErrorMessage(caught));
      setSubmitting(false);
    }
  }

  const feedback = success
    ? {
        tone: "success" as const,
        icon: CheckCircleIcon,
        message: "Login berhasil. Anda sedang diarahkan ke ruang kerja.",
      }
    : error
      ? {
          tone: "error" as const,
          icon: AlertCircleIcon,
          message: error,
        }
      : null;

  return (
    <main className="relative isolate h-screen overflow-hidden bg-[#f5f0e8] text-slate-900">
      <img
        alt="Ilustrasi kampus untuk halaman login Akara Elearning"
        className="absolute inset-0 h-full w-full object-cover object-center"
        src="/backgroundlogin.png"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,245,239,0.96)_0%,rgba(248,245,239,0.84)_34%,rgba(248,245,239,0.48)_58%,rgba(248,245,239,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(180,35,24,0.16),transparent_30%)]" />

      <div className="relative z-10 flex h-full min-h-0 items-center px-4 sm:px-8 lg:px-12">
        <div className="flex w-full min-h-0 max-w-[410px] flex-col justify-center py-[50px]">
          <div className="mb-3 flex shrink-0 items-center gap-2.5 text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-[20px] border border-white/80 bg-white/78 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              <BookOpenIcon className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                Akara Elearning
              </p>
              <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                Portal Akademik
              </h1>
            </div>
          </div>

          <div className="max-w-[500px] shrink-0 space-y-1">
            <p className="text-[clamp(1.35rem,2.6vw,1.9rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-900">
              Masuk sekali, lanjutkan sesuai peran akademik.
            </p>
            <p className="max-w-[420px] text-[12px] leading-5 text-slate-600">
              Satu portal terpadu untuk mahasiswa dan dosen dengan akses yang tetap
              dipisahkan berdasarkan role.
            </p>
          </div>

          <section className="mt-4 flex w-full max-w-[500px] min-h-0 shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/76 p-4 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:p-5">
            <div className="mb-2.5 shrink-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
                Masuk ke Akara
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Gunakan akun akademik yang sudah terdaftar.
              </p>
            </div>

            {feedback ? (
              <div className="mb-2.5 shrink-0" aria-live="polite">
                <div
                  className={
                    feedback.tone === "error"
                      ? "flex items-start gap-2 rounded-[18px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-4 text-red-700"
                      : "flex items-start gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] leading-4 text-emerald-700"
                  }
                >
                  <feedback.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{feedback.message}</span>
                </div>
              </div>
            ) : null}

            <form className="shrink-0 space-y-2.5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email
                </span>
                <span className="relative block">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    autoComplete="email"
                    className="h-11 w-full rounded-[18px] border border-slate-200/90 bg-white/92 pl-9 pr-3 text-[12px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(180,35,24,0.12)]"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@akara.edu"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Kata sandi
                </span>
                <span className="relative block">
                  <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    autoComplete="current-password"
                    className="h-11 w-full rounded-[18px] border border-slate-200/90 bg-white/92 pl-9 pr-3 text-[12px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(180,35,24,0.12)]"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    type="password"
                    value={password}
                  />
                </span>
              </label>

              <button
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[18px] bg-[var(--color-primary)] px-4 text-[12px] font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-4 focus:ring-[rgba(180,35,24,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? (
                  <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 flex shrink-0 items-center gap-2 text-[10px] text-slate-500">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <CheckCircleIcon className="h-3 w-3" />
              </span>
              <p>Akses mengikuti role mahasiswa atau dosen yang terhubung ke akun Anda.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
