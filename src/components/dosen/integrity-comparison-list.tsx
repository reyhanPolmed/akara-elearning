import type { IntegrityPairSummary } from "../../lib/dosen-task-integrity";
import { cn } from "../../lib/utils";

type IntegrityComparisonListProps = {
  items: IntegrityPairSummary[];
  activeDocumentId: string;
  onSelect: (documentId: string) => void;
};

function formatPercent(value: number | null) {
  if (value === null) return "-";
  return `${Math.round(value)}%`;
}

export function IntegrityComparisonList({
  items,
  activeDocumentId,
  onSelect,
}: IntegrityComparisonListProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white">
      <div className="border-b border-[#eeeeee] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Dokumen pembanding
        </p>
        <p className="mt-2 text-[12px] leading-5 text-slate-500">Pilih dokumen untuk melihat perbandingan.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="divide-y divide-[#eeeeee]">
          {items.map((item) => {
            const isActive = item.comparisonId === activeDocumentId;

            return (
              <button
                key={item.comparisonId}
                type="button"
                onClick={() => onSelect(item.comparisonId)}
                aria-pressed={isActive}
                className={cn(
                  "w-full cursor-pointer border-l-2 px-4 py-4 text-left transition-colors focus:outline-none focus:ring-4 focus:ring-inset focus:ring-slate-900/10",
                  isActive
                    ? "border-l-slate-950 bg-[#f5f5f5]"
                    : "border-l-transparent bg-white hover:bg-[#fafafa]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-950">{item.studentName}</p>
                    <p className="mt-1 truncate text-[12px] text-slate-500">{item.documentLabel}</p>
                  </div>
                  <span className="shrink-0 text-[16px] font-semibold tracking-[-0.03em] text-amber-700">
                    {formatPercent(item.similarityScore)}
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Tingkat kemiripan
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
