"use client";

import clsx from "clsx";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-start justify-between gap-3 pb-4 md:pb-6",
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-500)]/10 dark:text-[var(--color-brand-300)]">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] md:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
