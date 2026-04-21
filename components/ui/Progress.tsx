import clsx from "clsx";

export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  showLabel = false,
  className,
  size = "md",
}: {
  value: number;
  max?: number;
  tone?: "brand" | "emerald" | "amber" | "rose";
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const BAR: Record<string, string> = {
    brand: "bg-[var(--color-brand-500)]",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  const H = { sm: "h-1.5", md: "h-2", lg: "h-2.5" }[size];
  return (
    <div className={className}>
      <div
        className={clsx(
          "w-full overflow-hidden rounded-full bg-[var(--surface-2)]",
          H,
        )}
      >
        <div
          className={clsx("h-full rounded-full transition-all", BAR[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <div className="mt-1 text-xs muted tabular-nums">{pct.toFixed(0)}%</div>
      ) : null}
    </div>
  );
}
