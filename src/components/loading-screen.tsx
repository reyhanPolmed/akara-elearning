export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6">
      <div className="rounded-[14px] border border-[var(--color-line)] bg-white px-5 py-4 text-sm font-semibold text-[var(--color-muted)] shadow-[var(--shadow-panel)]">
        Memuat sesi...
      </div>
    </div>
  );
}
