import { DashboardPanel } from "./dashboard-panel";

type DashboardLoadingStateProps = {
  title: string;
  description?: string;
};

type DashboardErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function DashboardLoadingState({
  title,
  description = "Mengambil data terbaru dari backend.",
}: DashboardLoadingStateProps) {
  return (
    <div className="-mx-2.5 -my-3 min-h-[calc(100vh-52px)] bg-[#fcfcfc] px-5 pb-14 pt-9 sm:-mx-3.5 sm:px-8 lg:-mx-4 lg:-my-3.5 lg:px-10 lg:pb-16 lg:pt-12 2xl:px-14">
      <section
        aria-busy="true"
        aria-live="polite"
        className="mx-auto max-w-[1260px]"
        role="status"
      >
        <header className="border-b border-[#e5e5e5] pb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
            Memuat halaman
          </p>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#0a0a0a] sm:text-[38px]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#737373]">{description}</p>
        </header>

        <div className="border-b border-[#e5e5e5] py-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
              Menyiapkan konten
            </p>
            <p className="text-xs text-[#737373]">Mohon tunggu</p>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#f1f0ee]" aria-hidden="true">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--color-primary)] motion-reduce:animate-none" />
          </div>
        </div>

        <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]" aria-hidden="true">
          <div className="divide-y divide-[#eeeeee] border-y border-[#e5e5e5]">
            {[0, 1, 2].map((item) => (
              <div className="grid gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center" key={item}>
                <div>
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[#e5e5e5] motion-reduce:animate-none" />
                  <div className="mt-4 h-4 w-3/5 animate-pulse rounded-full bg-[#d4d4d4] motion-reduce:animate-none" />
                  <div className="mt-3 h-3 w-2/5 animate-pulse rounded-full bg-[#eeeeee] motion-reduce:animate-none" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-[#eeeeee] motion-reduce:animate-none" />
              </div>
            ))}
          </div>

          <div className="border-t border-[#e5e5e5] pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="h-3 w-28 animate-pulse rounded-full bg-[#e5e5e5] motion-reduce:animate-none" />
            <div className="mt-5 h-5 w-4/5 animate-pulse rounded-full bg-[#d4d4d4] motion-reduce:animate-none" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#eeeeee] motion-reduce:animate-none" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-[#eeeeee] motion-reduce:animate-none" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <DashboardPanel className="p-6 sm:p-7" padded={false}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-red-600">Data belum tersedia</p>
          <h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
            Dashboard tidak dapat dimuat.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{message}</p>
        </div>
        <button
          className="inline-flex w-fit rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          onClick={onRetry}
          type="button"
        >
          Muat ulang
        </button>
      </div>
    </DashboardPanel>
  );
}
