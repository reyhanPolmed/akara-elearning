import type { PropsWithChildren } from "react";

import { cn } from "../lib/utils";

type StatusBadgeProps = PropsWithChildren<{
  tone?: "neutral" | "success" | "warning" | "danger" | "primary" | "review";
}>;

const toneClassName: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  primary: "border-red-200 bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]",
  review: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
        toneClassName[tone]
      )}
    >
      {children}
    </span>
  );
}
