"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import { Input } from "./Input";

export function Toolbar({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  filters,
  actions,
  className,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mb-4 flex flex-wrap items-center gap-2 rounded-2xl border bg-[var(--surface)] p-3 shadow-sm",
        className,
      )}
    >
      {onSearch ? (
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            inputSize="sm"
          />
        </div>
      ) : null}
      {filters ? (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
