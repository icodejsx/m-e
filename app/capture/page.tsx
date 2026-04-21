"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardEdit, Save, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { TemplateField } from "@/lib/types";
import { formatCurrency, nowISO } from "@/lib/utils";

export default function CapturePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center muted">Loading capture form…</div>
      }
    >
      <CaptureInner />
    </Suspense>
  );
}

function CaptureInner() {
  const { state, add } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const initialTemplateId =
    params.get("template") ?? state.templates[0]?.id ?? "";
  const [templateId, setTemplateId] = useState<string>(initialTemplateId);

  useEffect(() => {
    if (!templateId && state.templates.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemplateId(state.templates[0].id);
    }
  }, [state.templates, templateId]);

  const template = state.templates.find((t) => t.id === templateId) ?? null;

  const defaultTitle = useMemo(() => {
    if (!template) return "";
    const period = state.reportingPeriods.find(
      (p) => p.id === state.activePeriodId,
    );
    return `${template.name}${period ? ` – ${period.name}` : ""}`;
  }, [template, state.activePeriodId, state.reportingPeriods]);

  const [title, setTitle] = useState(defaultTitle);
  const [mdaId, setMdaId] = useState(state.mdas[0]?.id ?? "");
  const [typeId, setTypeId] = useState<string>(template?.reportTypeId ?? "");
  const [periodId, setPeriodId] = useState<string>(
    state.activePeriodId ?? state.reportingPeriods[0]?.id ?? "",
  );
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setTitle(defaultTitle);
    setTypeId(template?.reportTypeId ?? "");
    setValues({});
    setErrors({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [templateId, defaultTitle, template]);

  function setFieldValue(key: string, v: unknown) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function validate(requireAll: boolean): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs._title = "Title is required";
    if (!mdaId) errs._mda = "MDA is required";
    if (!typeId) errs._type = "Report type is required";
    if (!periodId) errs._period = "Period is required";
    if (template && requireAll) {
      for (const f of template.fields) {
        if (!f.required) continue;
        const v = values[f.key];
        const empty =
          v === undefined ||
          v === null ||
          v === "" ||
          (Array.isArray(v) && v.length === 0);
        if (empty) errs[f.key] = `${f.label} is required`;
      }
    }
    return errs;
  }

  function save(submit: boolean) {
    const errs = validate(submit);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.warn("Missing information", "Please complete the highlighted fields.");
      return;
    }
    const created = add("reports", {
      title: title.trim(),
      mdaId,
      typeId,
      periodId,
      status: submit ? "submitted" : "draft",
      templateId: template?.id,
      submittedBy: state.activeUserId ?? undefined,
      submittedAt: submit ? nowISO() : undefined,
      values,
      notes,
    } as never);
    toast.success(
      submit ? "Report submitted" : "Draft saved",
      submit
        ? "The report is now in the submitted queue."
        : "You can find it in Reports and continue later.",
    );
    router.push("/reports");
    return created;
  }

  if (state.templates.length === 0) {
    return (
      <div>
        <PageHeader
          icon={<ClipboardEdit className="h-5 w-5" />}
          title="Fill Dynamic Form"
          subtitle="Capture data using a saved template."
        />
        <EmptyState
          title="No templates yet"
          message="Create a Dynamic Template first — templates define the fields captured here."
          action={
            <Button onClick={() => router.push("/templates")}>
              Create a template
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<ClipboardEdit className="h-5 w-5" />}
        title="Fill Dynamic Form"
        subtitle="Capture data using a saved template."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => save(false)} leftIcon={<Save className="h-4 w-4" />}>
              Save draft
            </Button>
            <Button onClick={() => save(true)} leftIcon={<Send className="h-4 w-4" />}>
              Submit report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px,1fr]">
        <Card className="lg:sticky lg:top-[140px] lg:h-fit">
          <CardHeader title="Report context" subtitle="Details attached to the report." />
          <CardBody className="space-y-4">
            <Field label="Template">
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {state.templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title" required error={errors._title}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="MDA" required error={errors._mda}>
              <Select value={mdaId} onChange={(e) => setMdaId(e.target.value)}>
                <option value="">— Select —</option>
                {state.mdas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Report type" required error={errors._type}>
              <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                <option value="">— Select —</option>
                {state.reportTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Period" required error={errors._period}>
              <Select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
                <option value="">— Select —</option>
                {state.reportingPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={template?.name ?? "Template"}
            subtitle={
              template?.description ?? "Fill in the fields defined by this template."
            }
            actions={
              template ? (
                <Badge tone="neutral">{template.fields.length} fields</Badge>
              ) : null
            }
          />
          <CardBody>
            {!template ? (
              <EmptyState title="Pick a template" />
            ) : template.fields.length === 0 ? (
              <EmptyState
                title="This template has no fields"
                message="Edit the template to add fields, then come back to capture data."
                action={
                  <Button onClick={() => router.push(`/templates`)}>
                    Edit template
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {template.fields.map((f) => (
                  <div
                    key={f.id}
                    className={
                      f.type === "textarea" || f.type === "multiselect"
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <DynamicField
                      field={f}
                      value={values[f.key]}
                      error={errors[f.key]}
                      onChange={(v) => setFieldValue(f.key, v)}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const common = { required: field.required };
  const label = field.label;
  switch (field.type) {
    case "textarea":
      return (
        <Field label={label} {...common} error={error} hint={field.help}>
          <Textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            invalid={!!error}
          />
        </Field>
      );
    case "number":
      return (
        <Field label={label} {...common} error={error} hint={field.help}>
          <Input
            type="number"
            min={field.min}
            max={field.max}
            value={(value as number | string) ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder={field.placeholder}
            invalid={!!error}
          />
        </Field>
      );
    case "currency":
      return (
        <Field
          label={label}
          {...common}
          error={error}
          hint={
            field.help ??
            (typeof value === "number" && !isNaN(value)
              ? formatCurrency(value)
              : undefined)
          }
        >
          <Input
            type="number"
            min={field.min}
            value={(value as number | string) ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder={field.placeholder ?? "0"}
            invalid={!!error}
          />
        </Field>
      );
    case "date":
      return (
        <Field label={label} {...common} error={error} hint={field.help}>
          <Input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          />
        </Field>
      );
    case "select":
      return (
        <Field label={label} {...common} error={error} hint={field.help}>
          <Select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          >
            <option value="">— Select —</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "multiselect":
      return (
        <Field label={label} {...common} error={error} hint={field.help ?? "Cmd/Ctrl-click for multiple"}>
          <select
            multiple
            value={(value as string[]) ?? []}
            onChange={(e) =>
              onChange(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
            className="block w-full rounded-lg border bg-[var(--surface)] p-2 text-sm min-h-[120px]"
          >
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      );
    case "checkbox":
      return (
        <Field label={label} error={error} hint={field.help}>
          <label className="inline-flex h-10 items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="text-sm">{field.placeholder ?? "Yes"}</span>
          </label>
        </Field>
      );
    case "file":
      return (
        <Field label={label} {...common} error={error} hint="File name or reference">
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? "e.g. quarterly_report.pdf"}
            invalid={!!error}
          />
        </Field>
      );
    case "text":
    default:
      return (
        <Field label={label} {...common} error={error} hint={field.help}>
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            invalid={!!error}
          />
        </Field>
      );
  }
}
