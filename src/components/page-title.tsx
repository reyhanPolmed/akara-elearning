import type { PropsWithChildren } from "react";

type PageTitleProps = PropsWithChildren<{
  eyebrow?: string;
  description?: string;
}>;

export function PageTitle({ eyebrow, children, description }: PageTitleProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">
        {children}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
