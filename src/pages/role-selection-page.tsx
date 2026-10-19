import { Navigate, useNavigate } from "react-router-dom";

import { PageTitle } from "../components/page-title";
import { SectionCard } from "../components/section-card";
import { getDefaultRedirect, roleLabels } from "../lib/auth";
import { useAuth } from "../lib/auth-context";

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const { user, setActiveRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.roles.length === 1) {
    return <Navigate to={getDefaultRedirect(user.roles[0])} replace />;
  }

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <PageTitle
          eyebrow="Pilih role"
          description="Akun ini memiliki lebih dari satu akses. Pilih ruang kerja yang ingin digunakan."
        >
          Lanjutkan sebagai
        </PageTitle>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {user.roles.map((role) => (
            <SectionCard key={role}>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                {roleLabels[role]}
              </p>
              <h2 className="mt-3 text-xl font-bold text-[var(--color-ink)]">
                Ruang kerja {roleLabels[role]}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Buka dashboard dan fitur akademik sesuai role yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveRole(role);
                  navigate(getDefaultRedirect(role));
                }}
                className="mt-5 rounded-[10px] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              >
                Masuk sebagai {roleLabels[role]}
              </button>
            </SectionCard>
          ))}
        </div>
      </div>
    </main>
  );
}
