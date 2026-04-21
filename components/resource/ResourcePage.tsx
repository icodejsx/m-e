"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import type { CollectionKey, ID } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RowActions } from "@/components/ui/RowActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type WithBase = { id: ID; createdAt: string; updatedAt: string };

export interface FormRenderCtx<T> {
  value: Partial<T>;
  setValue: (patch: Partial<T>) => void;
  setField: <K extends keyof T>(key: K, v: T[K]) => void;
  errors: Record<string, string>;
}

export interface ResourcePageProps<T extends WithBase> {
  collection: CollectionKey;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  singular: string;
  plural: string;
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  filterFn?: (item: T) => boolean;
  renderForm: (ctx: FormRenderCtx<T>) => ReactNode;
  validate?: (value: Partial<T>) => Record<string, string>;
  defaultValue?: () => Partial<T>;
  canDelete?: (item: T) => string | null;
  rowActions?: (item: T) => ReactNode;
  emptyMessage?: string;
  additionalActions?: ReactNode;
  modalSize?: "sm" | "md" | "lg" | "xl";
}

export function ResourcePage<T extends WithBase>(props: ResourcePageProps<T>) {
  const {
    collection,
    icon,
    title,
    subtitle,
    singular,
    columns,
    searchKeys,
    filterFn,
    renderForm,
    validate,
    defaultValue,
    canDelete,
    rowActions,
    emptyMessage,
    additionalActions,
    modalSize = "md",
  } = props;

  const { state, add, update, remove } = useStore();
  const modal = useModal();
  const toast = useToast();
  const [query, setQuery] = useState("");

  const items = state[collection] as unknown as T[];

  const filtered = useMemo(() => {
    let list = items;
    if (filterFn) list = list.filter(filterFn);
    if (query && searchKeys?.length) {
      const q = query.toLowerCase();
      list = list.filter((it) =>
        searchKeys.some((k) => {
          const v = it[k];
          return v != null && String(v).toLowerCase().includes(q);
        }),
      );
    }
    return list;
  }, [items, filterFn, query, searchKeys]);

  function openForm(existing?: T) {
    const initial: Partial<T> = existing
      ? ({ ...existing } as Partial<T>)
      : defaultValue
        ? defaultValue()
        : {};

    modal.open({
      title: existing ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`,
      size: modalSize,
      body: (
        <FormBody<T>
          initial={initial}
          singular={singular}
          renderForm={renderForm}
          validate={validate}
          onCancel={() => modal.close()}
          onSubmit={(value) => {
            if (existing) {
              update(collection, existing.id, value as Partial<T>);
              toast.success(`${singular} updated`);
            } else {
              add(collection, value as never);
              toast.success(`${singular} added`);
            }
            modal.close();
          }}
          isEdit={!!existing}
        />
      ),
    });
  }

  async function handleDelete(item: T) {
    const block = canDelete?.(item);
    if (block) {
      toast.warn("Cannot delete", block);
      return;
    }
    const ok = await modal.confirm({
      title: `Delete ${singular.toLowerCase()}?`,
      message: "This action cannot be undone.",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    remove(collection, item.id);
    toast.success(`${singular} deleted`);
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
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
              New {singular.toLowerCase()}
            </Button>
          </div>
        }
      />

      <Toolbar
        search={query}
        onSearch={searchKeys?.length ? setQuery : undefined}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
      />

      <DataTable<T>
        columns={columns}
        rows={filtered}
        rowActions={(row) => (
          <RowActions
            onEdit={() => openForm(row)}
            onDelete={() => handleDelete(row)}
            extra={rowActions?.(row)}
          />
        )}
        empty={
          <EmptyState
            title={items.length === 0 ? `No ${title.toLowerCase()} yet` : "No results"}
            message={
              items.length === 0
                ? (emptyMessage ?? `Get started by adding your first ${singular.toLowerCase()}.`)
                : "Try changing the search filter."
            }
            action={
              items.length === 0 ? (
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => openForm()}
                >
                  New {singular.toLowerCase()}
                </Button>
              ) : null
            }
          />
        }
      />
    </div>
  );
}

function FormBody<T extends WithBase>({
  initial,
  singular,
  renderForm,
  validate,
  onCancel,
  onSubmit,
  isEdit,
}: {
  initial: Partial<T>;
  singular: string;
  renderForm: (ctx: FormRenderCtx<T>) => ReactNode;
  validate?: (value: Partial<T>) => Record<string, string>;
  onCancel: () => void;
  onSubmit: (value: Partial<T>) => void;
  isEdit: boolean;
}) {
  const [value, setValueState] = useState<Partial<T>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setValue(patch: Partial<T>) {
    setValueState((prev) => ({ ...prev, ...patch }));
  }
  function setField<K extends keyof T>(key: K, v: T[K]) {
    setValueState((prev) => ({ ...prev, [key]: v }) as Partial<T>);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate ? validate(value) : {};
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderForm({ value, setValue, setField, errors })}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? "Save changes" : `Add ${singular.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}
