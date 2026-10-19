import { SectionCard } from "./section-card";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <SectionCard>
      <p className="text-sm font-medium text-[var(--color-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[var(--color-ink)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{detail}</p>
    </SectionCard>
  );
}
