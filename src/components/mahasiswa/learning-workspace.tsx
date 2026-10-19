import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";

type LearningWorkspaceProps = PropsWithChildren<{
  wide?: boolean;
}>;

type LearningBreadcrumbProps = {
  current: string;
  href?: string;
  label?: string;
};

type LearningPageHeaderProps = {
  aside?: ReactNode;
  description: ReactNode;
  eyebrow: string;
  meta?: ReactNode;
  title: ReactNode;
};

export const learningPanelClassName =
  "overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white";

export function LearningWorkspace({ children, wide = false }: LearningWorkspaceProps) {
  return (
    <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
      <div className={cn("mx-auto space-y-10", wide ? "max-w-[1440px]" : "max-w-[1260px]")}>{children}</div>
    </div>
  );
}

export function LearningBreadcrumb({
  current,
  href = "/mahasiswa/modul",
  label = "Mata Kuliah",
}: LearningBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-h-11 flex-wrap items-center gap-2 text-sm font-medium text-[#737373]">
      <Link
        className="transition hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
        to={href}
      >
        &larr; {label}
      </Link>
      <span aria-hidden="true" className="text-[#d4d4d4]">/</span>
      <span className="max-w-full truncate text-[#0a0a0a]">{current}</span>
    </nav>
  );
}

export function LearningPageHeader({
  aside,
  description,
  eyebrow,
  meta,
  title,
}: LearningPageHeaderProps) {
  return (
    <header className="border-b border-[#e5e5e5] pb-9">
      <div className={cn("gap-8", Boolean(aside) && "grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end")}>
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.16] tracking-[-0.05em] text-[#0a0a0a] sm:text-[40px]">
            {title}
          </h1>
          <div className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">{description}</div>
          {meta ? <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-medium text-[#737373]">{meta}</div> : null}
        </div>
        {aside ? <div className="mt-8 lg:mt-0">{aside}</div> : null}
      </div>
    </header>
  );
}
