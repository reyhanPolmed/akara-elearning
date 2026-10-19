type ProgressIndicatorProps = {
  label?: string;
  tone?: "primary" | "workspace";
  value: number;
};

export function ProgressIndicator({
  label = "Progress",
  tone = "workspace",
  value,
}: ProgressIndicatorProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const fillClassName = tone === "workspace" ? "bg-slate-900" : "bg-[var(--color-primary)]";

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{normalized}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${fillClassName}`}
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
