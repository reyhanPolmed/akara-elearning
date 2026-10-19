type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmDialog({
  cancelLabel = "Batal",
  confirmLabel = "Konfirmasi",
  description,
  isLoading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <section
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)]"
        role="alertdialog"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-100 text-slate-900">
          <span className="text-xl font-semibold">!</span>
        </div>
        <h2
          className="text-xl font-semibold tracking-[-0.03em] text-slate-950"
          id="confirm-dialog-title"
        >
          {title}
        </h2>
        <p
          className="mt-2 text-sm leading-6 text-slate-500"
          id="confirm-dialog-description"
        >
          {description}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-900/5 disabled:opacity-50"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:opacity-50"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
