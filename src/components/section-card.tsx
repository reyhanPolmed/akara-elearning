import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils";

type SectionCardProps = HTMLAttributes<HTMLDivElement>;

export function SectionCard({ className, ...props }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-panel)]",
        className
      )}
      {...props}
    />
  );
}
