"use client";

import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";

export function RowActions({
  onEdit,
  onDelete,
  extra,
  disabled,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {extra}
      {onEdit ? (
        <IconButton onClick={onEdit} title="Edit" disabled={disabled}>
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
      ) : null}
      {onDelete ? (
        <IconButton
          onClick={onDelete}
          title="Delete"
          disabled={disabled}
          tone="danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      ) : null}
    </div>
  );
}

export function IconButton({
  children,
  title,
  onClick,
  disabled,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={clsx(
        "inline-grid h-8 w-8 place-items-center rounded-lg border text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-50",
        tone === "danger" &&
          "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300",
        className,
      )}
    >
      {children}
    </button>
  );
}
