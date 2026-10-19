import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils";

type DashboardPanelProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
  variant?: "workspace" | "plain";
};

export function DashboardPanel({
  title,
  description,
  action,
  padded = true,
  variant = "workspace",
  className,
  children,
  ...props
}: DashboardPanelProps) {
  const isWorkspace = variant === "workspace";

  return (
    <section
      className={cn(
        isWorkspace
          ? "dashboard-panel overflow-hidden"
          : "overflow-hidden rounded-[22px] border border-[var(--color-line)] bg-white shadow-[0_16px_46px_rgba(15,23,42,0.06)]",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div
          className={cn(
            "flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
            isWorkspace ? "border-[var(--workspace-border-color)]" : "border-[var(--color-line)]"
          )}
        >
          <div>
            {title ? (
              <h2
                className={cn(
                  "text-[18px] tracking-[-0.03em]",
                  isWorkspace
                    ? "font-semibold text-slate-950"
                    : "font-bold text-[var(--color-ink)]"
                )}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                className={cn(
                  "mt-1 text-sm leading-6",
                  isWorkspace ? "text-slate-500" : "text-[var(--color-muted)]"
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
