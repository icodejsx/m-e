"use client";

import { FileCode, Pencil, Plus, Trash2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconButton, RowActions } from "@/components/ui/RowActions";
import { Toolbar } from "@/components/ui/Toolbar";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { TemplatesApi } from "@/lib/api/endpoints";
import { useProjects, useReports } from "@/lib/api/hooks";
import type {
  CreateTemplateFieldDto,
  TemplateDto,
  TemplateFieldDto,
} from "@/lib/api/types";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "currency",
  "date",
  "select",
  "multiselect",
  "checkbox",
  "file",
];

const TEMPLATE_TYPES = ["Report", "Project", "Generic"];

export default function TemplatesPage() {
  const modal = useModal();
  const toast = useToast();
  const { data: reports } = useReports();
  const { data: projects } = useProjects();

  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await TemplatesApi.list({ page: 1, pageSize: 100 });
      setTemplates(res.items ?? []);
      setSelectedId((prev) =>
        prev && (res.items ?? []).some((t) => t.id === prev)
          ? prev
          : (res.items?.[0]?.id ?? null),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(
    () =>
      templates.filter((t) =>
        (t.name ?? "").toLowerCase().includes(query.toLowerCase()),
      ),
    [templates, query],
  );

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  async function refreshOne(id: number) {
    try {
      const fresh = await TemplatesApi.get(id);
      setTemplates((prev) => prev.map((t) => (t.id === id ? fresh : t)));
    } catch {
      reload();
    }
  }

  function openTemplateForm(existing?: TemplateDto) {
    modal.open({
      title: existing ? "Edit template" : "New template",
      size: "md",
      body: (
        <TemplateMetaForm
          initial={existing ?? null}
          reports={reports}
          projects={projects}
          onCancel={() => modal.close()}
          onSave={async (meta) => {
            try {
              if (existing) {
                await TemplatesApi.update(existing.id, meta);
                toast.success("Template updated");
              } else {
                const created = await TemplatesApi.create(meta);
                setSelectedId(created.id);
                toast.success("Template created");
              }
              modal.close();
              await reload();
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
            }
          }}
        />
      ),
    });
  }

  async function deleteTemplate(t: TemplateDto) {
    const ok = await modal.confirm({
      title: `Delete "${t.name ?? "template"}"?`,
      message: "This will remove the template definition.",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await TemplatesApi.remove(t.id);
      if (selectedId === t.id) setSelectedId(null);
      toast.success("Template deleted");
      await reload();
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  function openFieldEditor(templateId: number) {
    modal.open({
      title: "New field",
      size: "md",
      body: (
        <FieldForm
          onCancel={() => modal.close()}
          onSave={async (field) => {
            try {
              await TemplatesApi.addField(templateId, field);
              toast.success("Field added");
              modal.close();
              await refreshOne(templateId);
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
            }
          }}
        />
      ),
    });
  }

  async function removeField(templateId: number, fieldId: number) {
    const ok = await modal.confirm({
      title: "Remove field?",
      message: "This will detach the field from the template.",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await TemplatesApi.removeField(templateId, fieldId);
      toast.success("Field removed");
      await refreshOne(templateId);
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
        icon={<FileCode className="h-5 w-5" />}
        title="Dynamic Templates"
        subtitle="Design reusable forms for capturing report data."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={reload}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => openTemplateForm()}
            >
              New template
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

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
                title={loading ? "Loading…" : "No templates"}
                message={
                  loading ? "Fetching templates…" : "Create your first template."
                }
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
                        {t.name ?? `Template #${t.id}`}
                      </span>
                      <Badge tone="neutral">
                        {(t.fields?.length ?? 0)} fields
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] muted">
                      <span>#{t.id}</span>
                      {t.type ? <span>· {t.type}</span> : null}
                    </div>
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
                title={selected.name ?? `Template #${selected.id}`}
                subtitle={
                  selected.type
                    ? `Type: ${selected.type}`
                    : "Define the fields captured by this form."
                }
                actions={
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/capture?template=${selected.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-2)]"
                    >
                      Capture data
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
                {(selected.fields?.length ?? 0) === 0 ? (
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
                    {(selected.fields ?? []).map((f) => (
                      <li
                        key={f.id}
                        className="group flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {f.fieldName ?? `Field #${f.id}`}
                            </span>
                            {f.required ? (
                              <Badge tone="danger">required</Badge>
                            ) : null}
                            <Badge tone="neutral">{f.fieldType ?? "—"}</Badge>
                          </div>
                          <div className="mt-0.5 text-xs muted">
                            #{f.id}
                            {f.unitId ? ` · unit #${f.unitId}` : ""}
                            {f.options ? ` · options: ${f.options}` : ""}
                          </div>
                        </div>
                        <RowActions
                          onDelete={() => removeField(selected.id, f.id)}
                        />
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

function TemplateMetaForm({
  initial,
  reports,
  projects,
  onCancel,
  onSave,
}: {
  initial: TemplateDto | null;
  reports: { id: number; reportName: string | null }[];
  projects: { id: number; projectName: string | null }[];
  onCancel: () => void;
  onSave: (v: {
    name: string;
    type: string;
    reportId?: number | null;
    projectId?: number | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "Report");
  const [reportId, setReportId] = useState<number | "">(initial?.reportId ?? "");
  const [projectId, setProjectId] = useState<number | "">(
    initial?.projectId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        reportId: reportId || null,
        projectId: projectId || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Template name" required error={error ?? undefined}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. PHC Monthly Service"
          autoFocus
          maxLength={256}
        />
      </Field>
      <Field label="Template type" required>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {TEMPLATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Linked report">
          <Select
            value={reportId}
            onChange={(e) => {
              const n = Number(e.target.value);
              setReportId(n || "");
              if (n) setProjectId("");
            }}
          >
            <option value="">— None —</option>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.reportName} (#{r.id})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Linked project">
          <Select
            value={projectId}
            onChange={(e) => {
              const n = Number(e.target.value);
              setProjectId(n || "");
              if (n) setReportId("");
            }}
          >
            <option value="">— None —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName} (#{p.id})
              </option>
            ))}
          </Select>
        </Field>
      </div>
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
          {initial ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}

function FieldForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (v: CreateTemplateFieldDto) => Promise<void>;
}) {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [required, setRequired] = useState(false);
  const [unitId, setUnitId] = useState<string>("");
  const [options, setOptions] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!fieldName.trim()) errs.fieldName = "Name is required";
    if (!fieldType) errs.fieldType = "Type is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        fieldName: fieldName.trim(),
        fieldType,
        required,
        unitId: unitId ? Number(unitId) : null,
        options: options.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const showOptions = fieldType === "select" || fieldType === "multiselect";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Field name" required error={errors.fieldName}>
          <Input
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="e.g. Patients treated"
            invalid={!!errors.fieldName}
            autoFocus
            maxLength={128}
          />
        </Field>
        <Field label="Field type" required error={errors.fieldType}>
          <Select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            invalid={!!errors.fieldType}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Unit ID">
        <Input
          type="number"
          min={1}
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          placeholder="Optional"
        />
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
      {showOptions ? (
        <Field
          label="Options"
          hint="Comma-separated list of values"
        >
          <Textarea
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            rows={3}
            placeholder="Yes, No, N/A"
          />
        </Field>
      ) : null}
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
          Add field
        </Button>
      </div>
    </form>
  );
}
