import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

type ResourceCardProps = {
  children: ReactNode;
  className?: string;
};

export function ResourceCard({ children, className }: ResourceCardProps) {
  return (
    <article
      className={cn(
        "rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_70px_-58px_rgba(15,23,42,0.35)]",
        className
      )}
    >
      {children}
    </article>
  );
}
