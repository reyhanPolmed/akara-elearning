import { AppShell } from "../components/app-shell";
import { PageTitle } from "../components/page-title";
import { SectionCard } from "../components/section-card";
import type { PortalRole } from "../lib/auth";

type PlaceholderPageProps = {
  role: PortalRole;
  title: string;
};

export function PlaceholderPage({ role, title }: PlaceholderPageProps) {
  return (
    <AppShell>
      <section className="grid gap-6">
        <PageTitle
          eyebrow={role === "dosen" ? "Dosen" : "Mahasiswa"}
          description="Route foundation sudah tersedia. Migrasi fitur detail dilakukan setelah kontrak auth stabil."
        >
          {title}
        </PageTitle>
        <SectionCard>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Halaman ini menjadi target migrasi fitur berikutnya dengan design system
            yang sama untuk seluruh portal.
          </p>
        </SectionCard>
      </section>
    </AppShell>
  );
}
