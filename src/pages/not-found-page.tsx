import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-5">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-ink)]">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Route ini belum tersedia di portal baru.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex rounded-[10px] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
        >
          Kembali ke login
        </Link>
      </div>
    </main>
  );
}
