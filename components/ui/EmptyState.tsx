import clsx from "clsx";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  message,
  icon,
  action,
  className,
}: {
  title?: React.ReactNode;
  message?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center",
        className,
      )}
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      {message ? (
        <div className="mt-1 max-w-md text-xs muted">{message}</div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
