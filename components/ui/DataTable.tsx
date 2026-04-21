"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  sortBy?: (row: T) => string | number | null | undefined;
  className?: string;
  align?: "left" | "center" | "right";
  width?: string;
  hidden?: "sm" | "md" | "lg" | "xl";
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  onRowClick,
  rowActions,
  initialSortKey,
  initialSortDir = "asc",
  pageSize = 10,
  dense = false,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
  pageSize?: number;
  dense?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortBy) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortBy!(a);
      const bv = col.sortBy!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page, totalPages - 1);
  const paged = sorted.slice(pageClamped * pageSize, (pageClamped + 1) * pageSize);

  function handleSort(col: Column<T>) {
    if (!col.sortBy) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  const HIDDEN_BP: Record<NonNullable<Column<T>["hidden"]>, string> = {
    sm: "hidden sm:table-cell",
    md: "hidden md:table-cell",
    lg: "hidden lg:table-cell",
    xl: "hidden xl:table-cell",
  };

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={clsx(
                    "px-4 py-3 font-medium",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.hidden && HIDDEN_BP[col.hidden],
                    col.sortBy && "cursor-pointer select-none hover:text-[var(--foreground)]",
                  )}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortBy ? (
                      sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
              {rowActions ? (
                <th className="w-[1%] px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  "border-t border-[var(--border)] transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[var(--surface-2)]",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      dense ? "px-4 py-2" : "px-4 py-3",
                      col.className,
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.hidden && HIDDEN_BP[col.hidden],
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td
                    className={clsx(
                      "text-right",
                      dense ? "px-4 py-2" : "px-4 py-3",
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rowActions(row)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-[var(--muted)]">
          <div>
            Showing {pageClamped * pageSize + 1}–
            {Math.min((pageClamped + 1) * pageSize, sorted.length)} of {sorted.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md border px-2 py-1 disabled:opacity-50 hover:bg-[var(--surface-2)]"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageClamped === 0}
            >
              Previous
            </button>
            <span className="px-2">
              Page {pageClamped + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="rounded-md border px-2 py-1 disabled:opacity-50 hover:bg-[var(--surface-2)]"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageClamped >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
