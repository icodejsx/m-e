"use client";

import { Plus, RefreshCcw, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RowActions } from "@/components/ui/RowActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { PagedResult } from "@/lib/api/types";

export interface FormRenderCtx<T, F> {
  value: Partial<F>;
  setValue: (patch: Partial<F>) => void;
  setField: <K extends keyof F>(key: K, v: F[K]) => void;
  errors: Record<string, string>;
  existing: T | null;
}

export interface RemoteResourcePageProps<T extends { id: number }, F> {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  singular: string;
  columns: Column<T & { id: string }>[];
  fetchPage: (args: {
    page: number;
    pageSize: number;
    search: string;
  }) => Promise<PagedResult<T> | T[]>;
  create?: (value: F) => Promise<unknown>;
  update?: (id: number, value: F) => Promise<unknown>;
  remove?: (id: number) => Promise<unknown>;
  toFormValue?: (row: T) => Partial<F>;
  defaultValue?: () => Partial<F>;
  validate?: (value: Partial<F>) => Record<string, string>;
  renderForm?: (ctx: FormRenderCtx<T, F>) => ReactNode;
  searchPlaceholder?: string;
  searchable?: boolean;
  rowActions?: (item: T) => ReactNode;
  additionalActions?: ReactNode;
  filters?: ReactNode;
  emptyMessage?: string;
  modalSize?: "sm" | "md" | "lg" | "xl";
  refreshKey?: unknown;
  pageSize?: number;
}

export function RemoteResourcePage<T extends { id: number }, F>(
  props: RemoteResourcePageProps<T, F>,
) {
  const {
    icon,
    title,
    subtitle,
    singular,
    columns,
    fetchPage,
    create,
    update,
    remove,
    toFormValue,
    defaultValue,
    validate,
    renderForm,
    searchPlaceholder,
    searchable = true,
    rowActions,
    additionalActions,
    filters,
    emptyMessage,
    modalSize = "md",
    refreshKey,
    pageSize = 20,
  } = props;

  const modal = useModal();
  const toast = useToast();

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchPage({ page, pageSize, search });
      if (id !== requestIdRef.current) return;
      if (Array.isArray(res)) {
        setItems(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else {
        setItems(res.items ?? []);
        setTotalCount(res.totalCount ?? 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (e) {
      if (id !== requestIdRef.current) return;
      setErr(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, page, pageSize, search, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(
    () => items.map((it) => ({ ...it, id: String(it.id) }) as T & { id: string }),
    [items],
  );

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  function openForm(existing: T | null) {
    if (!renderForm) return;
    const initial: Partial<F> = existing
      ? (toFormValue
          ? toFormValue(existing)
          : (existing as unknown as Partial<F>))
      : defaultValue
        ? defaultValue()
        : ({} as Partial<F>);

    modal.open({
      title: existing
        ? `Edit ${singular.toLowerCase()}`
        : `New ${singular.toLowerCase()}`,
      size: modalSize,
      body: (
        <FormBody<T, F>
          initial={initial}
          existing={existing}
          singular={singular}
          renderForm={renderForm}
          validate={validate}
          onCancel={() => modal.close()}
          onSubmit={async (value) => {
            try {
              if (existing && update) {
                await update(existing.id, value as F);
                toast.success(`${singular} updated`);
              } else if (!existing && create) {
                await create(value as F);
                toast.success(`${singular} added`);
              }
              modal.close();
              await load();
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
              throw e;
            }
          }}
          isEdit={!!existing}
        />
      ),
    });
  }

  async function handleDelete(item: T) {
    if (!remove) return;
    const ok = await modal.confirm({
      title: `Delete ${singular.toLowerCase()}?`,
      message: "This action cannot be undone.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await remove(item.id);
      toast.success(`${singular} deleted`);
      await load();
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  return (
    <div>
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            {additionalActions}
            <Button
              variant="outline"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={load}
              loading={loading}
            >
              Refresh
            </Button>
            {create && renderForm ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openForm(null)}
              >
                New {singular.toLowerCase()}
              </Button>
            ) : null}
          </div>
        }
      />

      <Toolbar
        search={search}
        onSearch={searchable ? setSearch : undefined}
        searchPlaceholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
        filters={filters}
      />

      {err ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{err}</div>
        </div>
      ) : null}

      <DataTable<T & { id: string }>
        columns={columns}
        rows={filtered}
        rowActions={(row) => {
          const original = items.find((it) => String(it.id) === row.id);
          if (!original) return null;
          const hasEdit = !!(update && renderForm);
          const hasDelete = !!remove;
          if (!hasEdit && !hasDelete && !rowActions) return null;
          return (
            <RowActions
              onEdit={hasEdit ? () => openForm(original) : undefined}
              onDelete={hasDelete ? () => handleDelete(original) : undefined}
              extra={rowActions?.(original)}
            />
          );
        }}
        pageSize={pageSize}
        empty={
          <EmptyState
            title={
              loading
                ? "Loading…"
                : search
                  ? "No results"
                  : `No ${title.toLowerCase()} yet`
            }
            message={
              loading
                ? "Fetching latest data from the server."
                : search
                  ? "Try changing the search filter."
                  : (emptyMessage ??
                    `Get started by adding your first ${singular.toLowerCase()}.`)
            }
            action={
              !loading && !search && create && renderForm ? (
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => openForm(null)}
                >
                  New {singular.toLowerCase()}
                </Button>
              ) : null
            }
          />
        }
      />

      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-xs muted">
          <div>
            Page {page} of {totalPages} · {totalCount} total
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md border px-2 py-1 disabled:opacity-50 hover:bg-[var(--surface-2)]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border px-2 py-1 disabled:opacity-50 hover:bg-[var(--surface-2)]"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormBody<T extends { id: number }, F>({
  initial,
  existing,
  singular,
  renderForm,
  validate,
  onCancel,
  onSubmit,
  isEdit,
}: {
  initial: Partial<F>;
  existing: T | null;
  singular: string;
  renderForm: (ctx: FormRenderCtx<T, F>) => ReactNode;
  validate?: (value: Partial<F>) => Record<string, string>;
  onCancel: () => void;
  onSubmit: (value: Partial<F>) => Promise<void>;
  isEdit: boolean;
}) {
  const [value, setValueState] = useState<Partial<F>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function setValue(patch: Partial<F>) {
    setValueState((prev) => ({ ...prev, ...patch }));
  }
  function setField<K extends keyof F>(key: K, v: F[K]) {
    setValueState((prev) => ({ ...prev, [key]: v }) as Partial<F>);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate ? validate(value) : {};
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(value);
    } catch {
      // keep modal open on error; toast already shown
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderForm({ value, setValue, setField, errors, existing })}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? "Save changes" : `Add ${singular.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}
