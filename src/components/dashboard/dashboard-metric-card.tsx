import type { ComponentType, SVGProps } from "react";

type DashboardMetricCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  variant?: "workspace" | "primary";
};

export function DashboardMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  variant = "workspace",
}: DashboardMetricCardProps) {
  const isWorkspace = variant === "workspace";

  return (
    <article
      className={
        isWorkspace
          ? "rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4"
          : "rounded-[18px] border border-[var(--color-line)] bg-[#f8fafc]/80 p-4"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={
              isWorkspace
                ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                : "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]"
            }
          >
            {label}
          </p>
          <p
            className={
              isWorkspace
                ? "mt-3 text-[30px] font-semibold leading-none tracking-[-0.04em] text-slate-950"
                : "mt-3 text-[30px] font-bold leading-none tracking-[-0.04em] text-[var(--color-ink)]"
            }
          >
            {value}
          </p>
          <p
            className={
              isWorkspace ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-[var(--color-muted)]"
            }
          >
            {helper}
          </p>
        </div>
        <div
          className={
            isWorkspace
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-red-100 bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          }
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
