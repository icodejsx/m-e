import clsx from "clsx";

export function Stat({
  label,
  value,
  icon,
  delta,
  tone = "brand",
  hint,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  delta?: React.ReactNode;
  tone?: "brand" | "emerald" | "amber" | "violet" | "rose" | "sky";
  hint?: React.ReactNode;
  className?: string;
}) {
  const TONES: Record<string, string> = {
    brand:
      "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-500)]/10 dark:text-[var(--color-brand-300)]",
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  };
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide muted">
          {label}
        </div>
        {icon ? (
          <div
            className={clsx(
              "grid h-9 w-9 place-items-center rounded-xl",
              TONES[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </div>
      {delta || hint ? (
        <div className="mt-1 text-xs muted flex items-center gap-1.5">
          {delta ? <span>{delta}</span> : null}
          {hint ? <span>{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
