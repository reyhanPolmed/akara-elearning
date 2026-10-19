type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--color-line)] bg-[#f8fafc]/80 p-5 text-center">
      <p className="font-bold text-[var(--color-ink)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
    </div>
  );
}
