"use client";

import { FileCode, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconButton, RowActions } from "@/components/ui/RowActions";
import { Toolbar } from "@/components/ui/Toolbar";
import { useModal } from "@/lib/modal";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { DynamicTemplate, FieldType, TemplateField } from "@/lib/types";
import { slugify, uid } from "@/lib/utils";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select (single)" },
  { value: "multiselect", label: "Select (multiple)" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File reference" },
];

export default function TemplatesPage() {
  const { state, add, update, remove } = useStore();
  const modal = useModal();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    state.templates[0]?.id ?? null,
  );

  const filtered = useMemo(
    () =>
      state.templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          (t.description ?? "").toLowerCase().includes(query.toLowerCase()),
      ),
    [state.templates, query],
  );

  const selected =
    state.templates.find((t) => t.id === selectedId) ?? state.templates[0] ?? null;

  function openTemplateForm(existing?: DynamicTemplate) {
    modal.open({
      title: existing ? "Edit template" : "New template",
      size: "md",
      body: (
        <TemplateMetaForm
          initial={existing}
          reportTypes={state.reportTypes}
          onCancel={() => modal.close()}
          onSave={(meta) => {
            if (existing) {
              update("templates", existing.id, meta);
              toast.success("Template updated");
            } else {
              const created = add("templates", { ...meta, fields: [] } as never);
              setSelectedId(created.id);
              toast.success("Template created");
            }
            modal.close();
          }}
        />
      ),
    });
  }

  async function deleteTemplate(t: DynamicTemplate) {
    const referencedBy = state.reportTypes.find((rt) => rt.templateId === t.id);
    if (referencedBy) {
      toast.warn("Cannot delete", `In use by report type "${referencedBy.name}".`);
      return;
    }
    const ok = await modal.confirm({
      title: `Delete "${t.name}"?`,
      message: "This will remove the template definition.",
      tone: "danger",
    });
    if (!ok) return;
    remove("templates", t.id);
    if (selectedId === t.id) setSelectedId(null);
    toast.success("Template deleted");
  }

  function openFieldEditor(
    templateId: string,
    existing?: TemplateField,
    atIndex?: number,
  ) {
    modal.open({
      title: existing ? "Edit field" : "New field",
      size: "md",
      body: (
        <FieldForm
          initial={existing}
          onCancel={() => modal.close()}
          onSave={(field) => {
            const tpl = state.templates.find((t) => t.id === templateId);
            if (!tpl) return;
            const fields = [...tpl.fields];
            if (existing) {
              const idx = fields.findIndex((f) => f.id === existing.id);
              if (idx >= 0) fields[idx] = { ...existing, ...field } as TemplateField;
            } else {
              const newField: TemplateField = { id: uid(), ...field } as TemplateField;
              if (atIndex === undefined) fields.push(newField);
              else fields.splice(atIndex, 0, newField);
            }
            update("templates", templateId, { fields });
            toast.success(existing ? "Field updated" : "Field added");
            modal.close();
          }}
        />
      ),
    });
  }

  function removeField(templateId: string, fieldId: string) {
    const tpl = state.templates.find((t) => t.id === templateId);
    if (!tpl) return;
    update("templates", templateId, {
      fields: tpl.fields.filter((f) => f.id !== fieldId),
    });
    toast.success("Field removed");
  }

  function moveField(templateId: string, fieldId: string, dir: -1 | 1) {
    const tpl = state.templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const idx = tpl.fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= tpl.fields.length) return;
    const arr = [...tpl.fields];
    const [item] = arr.splice(idx, 1);
    arr.splice(next, 0, item);
    update("templates", templateId, { fields: arr });
  }

  return (
    <div>
      <PageHeader
        icon={<FileCode className="h-5 w-5" />}
        title="Dynamic Templates"
        subtitle="Design reusable forms for capturing report data."
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => openTemplateForm()}
          >
            New template
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px,1fr]">
        <Card className="lg:sticky lg:top-[140px] lg:h-fit">
          <div className="border-b p-3">
            <Toolbar
              className="m-0 border-0 shadow-none bg-transparent p-0"
              search={query}
              onSearch={setQuery}
              searchPlaceholder="Search templates…"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No templates"
                message="Create your first template to build dynamic forms."
              />
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`flex w-full flex-col items-start gap-1 p-3 text-left transition-colors ${
                      selected?.id === t.id
                        ? "bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-500)]/10"
                        : "hover:bg-[var(--surface-2)]"
                    }`}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {t.name}
                      </span>
                      <Badge tone="neutral">{t.fields.length} fields</Badge>
                    </div>
                    {t.description ? (
                      <span className="line-clamp-1 text-xs muted">
                        {t.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          {selected ? (
            <Card>
              <CardHeader
                title={selected.name}
                subtitle={selected.description || "Define the fields captured by this form."}
                actions={
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/capture?template=${selected.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-2)]"
                    >
                      Try it
                    </Link>
                    <IconButton
                      onClick={() => openTemplateForm(selected)}
                      title="Edit template"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      tone="danger"
                      onClick={() => deleteTemplate(selected)}
                      title="Delete template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                }
              />
              <CardBody className="p-0">
                <div className="flex items-center justify-between border-b px-4 py-3 md:px-5">
                  <div className="text-xs font-semibold uppercase tracking-wide muted">
                    Fields
                  </div>
                  <Button
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => openFieldEditor(selected.id)}
                  >
                    Add field
                  </Button>
                </div>
                {selected.fields.length === 0 ? (
                  <EmptyState
                    className="m-4"
                    title="No fields yet"
                    message="Add at least one field to make this template usable."
                    action={
                      <Button
                        onClick={() => openFieldEditor(selected.id)}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add field
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y">
                    {selected.fields.map((f, i) => (
                      <li
                        key={f.id}
                        className="group flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{f.label}</span>
                            {f.required ? (
                              <Badge tone="danger">required</Badge>
                            ) : null}
                            <Badge tone="neutral">{fieldTypeLabel(f.type)}</Badge>
                          </div>
                          <div className="mt-0.5 text-xs muted">
                            key: <code className="rounded bg-[var(--surface-2)] px-1">{f.key}</code>
                            {f.options?.length ? (
                              <span> • {f.options.length} options</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconButton
                            title="Move up"
                            onClick={() => moveField(selected.id, f.id, -1)}
                            disabled={i === 0}
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            title="Move down"
                            onClick={() => moveField(selected.id, f.id, 1)}
                            disabled={i === selected.fields.length - 1}
                          >
                            ↓
                          </IconButton>
                          <RowActions
                            onEdit={() => openFieldEditor(selected.id, f)}
                            onDelete={() => removeField(selected.id, f.id)}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ) : (
            <EmptyState
              title="Select a template"
              message="Pick one on the left, or create a new template to begin."
              action={
                <Button
                  onClick={() => openTemplateForm()}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  New template
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function fieldTypeLabel(t: FieldType): string {
  return FIELD_TYPES.find((x) => x.value === t)?.label ?? t;
}

function TemplateMetaForm({
  initial,
  reportTypes,
  onCancel,
  onSave,
}: {
  initial?: DynamicTemplate;
  reportTypes: { id: string; name: string }[];
  onCancel: () => void;
  onSave: (
    v: Pick<DynamicTemplate, "name" | "description" | "reportTypeId">,
  ) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [reportTypeId, setReportTypeId] = useState<string | undefined>(
    initial?.reportTypeId,
  );
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSave({ name: name.trim(), description: description.trim(), reportTypeId });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Template name" required error={error ?? undefined}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. PHC Monthly Service"
          autoFocus
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Used by report type" hint="Optional default report type mapping.">
        <Select
          value={reportTypeId ?? ""}
          onChange={(e) => setReportTypeId(e.target.value || undefined)}
        >
          <option value="">— None —</option>
          {reportTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save" : "Create"}</Button>
      </div>
    </form>
  );
}

function FieldForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: TemplateField;
  onCancel: () => void;
  onSave: (v: Omit<TemplateField, "id">) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [type, setType] = useState<FieldType>(initial?.type ?? "text");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? "");
  const [help, setHelp] = useState(initial?.help ?? "");
  const [optionsText, setOptionsText] = useState(
    (initial?.options ?? []).join("\n"),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!label.trim()) errs.label = "Label is required";
    const finalKey = (key || slugify(label)).trim();
    if (!finalKey) errs.key = "Key is required";
    if ((type === "select" || type === "multiselect") && !optionsText.trim())
      errs.options = "Add at least one option";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave({
      label: label.trim(),
      key: finalKey,
      type,
      required,
      placeholder: placeholder.trim() || undefined,
      help: help.trim() || undefined,
      options:
        type === "select" || type === "multiselect"
          ? optionsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    });
  }

  const showOptions = type === "select" || type === "multiselect";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Label" required error={errors.label}>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (!initial && !key) setKey(slugify(e.target.value));
            }}
            placeholder="e.g. Patients treated"
            invalid={!!errors.label}
            autoFocus
          />
        </Field>
        <Field label="Field key" required error={errors.key} hint="Used as a JSON property.">
          <Input
            value={key}
            onChange={(e) => setKey(slugify(e.target.value))}
            placeholder="patients_treated"
            invalid={!!errors.key}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as FieldType)}>
            {FIELD_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Required?">
          <label className="inline-flex h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Must be filled in</span>
          </label>
        </Field>
      </div>
      <Field label="Placeholder">
        <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
      </Field>
      <Field label="Helper text">
        <Input value={help} onChange={(e) => setHelp(e.target.value)} />
      </Field>
      {showOptions ? (
        <Field label="Options" error={errors.options} hint="One per line.">
          <Textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={5}
            placeholder="Option 1\nOption 2\nOption 3"
          />
        </Field>
      ) : null}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save field" : "Add field"}</Button>
      </div>
    </form>
  );
}
