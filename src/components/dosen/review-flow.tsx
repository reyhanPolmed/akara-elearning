import { useId, type PropsWithChildren, type ReactNode } from "react";
import { Link } from "react-router-dom";

import type { ReviewCard } from "../../lib/dosen-review-flow";
import { cn } from "../../lib/utils";

type ReviewFlowHeaderProps = {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

type ReviewCardGridProps = {
  emptyMessage: string;
  items: ReviewCard[];
};

type ReviewWorkspaceProps = PropsWithChildren<{
  wide?: boolean;
}>;

type ReviewSectionProps = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

export function ReviewWorkspace({ children, wide = false }: ReviewWorkspaceProps) {
  return (
    <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
      <div className={cn("mx-auto space-y-10", wide ? "max-w-[1500px]" : "max-w-[1260px]")}>{children}</div>
    </div>
  );
}

export function ReviewFlowHeader({
  title,
  description,
  backHref,
  backLabel = "Kembali",
}: ReviewFlowHeaderProps) {
  return (
    <header className="border-b border-[#e5e5e5] pb-9">
      {backHref ? (
        <Link
          className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
          to={backHref}
        >
          &larr; {backLabel}
        </Link>
      ) : null}
      <p className={cn("text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]", backHref && "mt-5")}>
        Alur Review Dosen
      </p>
      <h1 className="mt-3 max-w-4xl text-[34px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[40px]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">{description}</p>
    </header>
  );
}

export function ReviewSection({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: ReviewSectionProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn("overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white", className)}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            {title ? (
              <h2 id={titleId} className="text-[20px] font-semibold tracking-[-0.035em] text-slate-950">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", contentClassName)}>{children}</div>
    </section>
  );
}

export function ReviewCardGrid({ emptyMessage, items }: ReviewCardGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-slate-300 bg-[#fafafa] px-6 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          className="group flex min-h-[220px] flex-col rounded-[12px] border border-[#e5e5e5] bg-white p-5 transition-colors hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 sm:p-6"
          key={item.id}
          to={item.href}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
              Review tugas
            </p>
            <h2 className="mt-3 line-clamp-2 text-[19px] font-semibold leading-snug tracking-[-0.035em] text-slate-950">
              {item.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-500">{item.description}</p>
          </div>

          <dl className="mt-6 grid grid-cols-3 divide-x divide-[#eeeeee] border-y border-[#eeeeee] py-4">
            {item.metrics.map((metric) => (
              <div className="min-w-0 px-3 first:pl-0 last:pr-0" key={metric.label}>
                <dt className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  {metric.label}
                </dt>
                <dd className="mt-2 truncate text-[17px] font-semibold tracking-[-0.03em] text-slate-950">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex items-center justify-between pt-5 text-[13px] font-semibold">
            <span className="text-slate-500 transition-colors group-hover:text-slate-950">Buka detail review</span>
            <span className="text-slate-950" aria-hidden="true">&rarr;</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
