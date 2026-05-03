"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardEdit, Save, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { TemplateDataApi, TemplatesApi } from "@/lib/api/endpoints";
import { useTargets, useTemplates } from "@/lib/api/hooks";
import type { TemplateDto, TemplateFieldDto } from "@/lib/api/types";

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
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { session } = useAuth();
  const { data: templates, loading: tplLoading } = useTemplates();
  const { data: targets } = useTargets();

  const initialTemplateId = params.get("template") ?? "";
  const [templateId, setTemplateId] = useState<string>(initialTemplateId);
  const [template, setTemplate] = useState<TemplateDto | null>(null);
  const [tplFetching, setTplFetching] = useState(false);

  const [targetId, setTargetId] = useState<string>("");
  const [reportingPeriodId, setReportingPeriodId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [values, setValues] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!templateId && templates.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemplateId(String(templates[0].id));
    }
  }, [templates, templateId]);

  const loadTemplate = useCallback(async () => {
    if (!templateId) {
      setTemplate(null);
      return;
    }
    setTplFetching(true);
    try {
      const res = await TemplatesApi.get(Number(templateId));
      setTemplate(res);
      setValues({});
      setErrors({});
    } catch (e) {
      toast.error(
        "Could not load template",
        e instanceof Error ? e.message : "Unexpected error",
      );
    } finally {
      setTplFetching(false);
    }
  }, [templateId, toast]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const fields = useMemo(() => template?.fields ?? [], [template]);

  const selectedTarget = useMemo(
    () => targets.find((t) => t.id === Number(targetId)),
    [targets, targetId],
  );

  useEffect(() => {
    if (selectedTarget) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setReportingPeriodId(String(selectedTarget.reportingPeriodId));
      setLocationId(String(selectedTarget.locationId));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [selectedTarget]);

  function setFieldValue(fieldId: number, v: string) {
    setValues((prev) => ({ ...prev, [fieldId]: v }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!session?.userId) errs._user = "Not signed in";
    if (!reportingPeriodId) errs._period = "Reporting period ID required";
    if (!locationId) errs._location = "Location ID required";
    if (fields.length === 0) errs._template = "This template has no fields";
    for (const f of fields) {
      if (f.required && !values[f.id]?.toString().trim()) {
        errs[String(f.id)] = `${f.fieldName} is required`;
      }
    }
    return errs;
  }

  async function submit() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.warn("Missing information", "Please complete the highlighted fields.");
      return;
    }
    if (!session) return;
    setSubmitting(true);
    try {
      const writeOne = async (f: TemplateFieldDto) => {
        const raw = values[f.id];
        if (raw === undefined || raw === "") return null;
        return TemplateDataApi.upsert({
          templateFieldId: f.id,
          targetId: targetId ? Number(targetId) : null,
          userId: session.userId,
          locationId: Number(locationId),
          reportingPeriodId: Number(reportingPeriodId),
          value: String(raw),
        });
      };
      const results = await Promise.all(fields.map(writeOne));
      const ok = results.filter(Boolean).length;
      toast.success(
        "Data saved",
        `${ok} field value${ok === 1 ? "" : "s"} stored.`,
      );
      router.push("/progress");
    } catch (e) {
      toast.error(
        "Submit failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!tplLoading && templates.length === 0) {
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
          <Button
            onClick={submit}
            loading={submitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Submit data
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px,1fr]">
        <Card className="lg:sticky lg:top-[140px] lg:h-fit">
          <CardHeader
            title="Context"
            subtitle="Required backend identifiers for the upsert."
          />
          <CardBody className="space-y-4">
            <Field label="Template">
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">— Select —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (#{t.id})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Linked target (optional)">
              <Select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">— None —</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.targetName} (#{t.id})
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Reporting period ID"
              required
              error={errors._period}
              hint="Numeric ID"
            >
              <Input
                type="number"
                min={1}
                value={reportingPeriodId}
                onChange={(e) => setReportingPeriodId(e.target.value)}
                invalid={!!errors._period}
              />
            </Field>
            <Field label="Location ID" required error={errors._location}>
              <Input
                type="number"
                min={1}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                invalid={!!errors._location}
              />
            </Field>
            <div className="rounded-lg border bg-[var(--surface-2)] p-3 text-[11px] muted">
              Signed in as{" "}
              <b>
                user #{session?.userId} · {session?.email}
              </b>
              . Submitted values are stored through the{" "}
              <code>/template-data</code> upsert endpoint.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={template?.name ?? "Template"}
            subtitle={template?.type ? `Type: ${template.type}` : undefined}
            actions={
              template ? (
                <Badge tone="neutral">{fields.length} fields</Badge>
              ) : null
            }
          />
          <CardBody>
            {tplFetching ? (
              <div className="p-6 text-center text-sm muted">
                Loading template…
              </div>
            ) : !template ? (
              <EmptyState title="Pick a template" />
            ) : fields.length === 0 ? (
              <EmptyState
                title="This template has no fields"
                message="Edit the template to add fields, then come back to capture data."
                action={
                  <Button onClick={() => router.push("/templates")}>
                    Edit template
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    className={
                      f.fieldType === "textarea" || f.fieldType === "multiselect"
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <DynamicField
                      field={f}
                      value={values[f.id] ?? ""}
                      error={errors[String(f.id)]}
                      onChange={(v) => setFieldValue(f.id, v)}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border bg-[var(--surface-2)] p-3 text-xs muted">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-600)]" />
                  Each field writes one <code>template-data</code> upsert on
                  submit.
                </div>
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
  field: TemplateFieldDto;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const label = (
    <span className="flex items-center gap-1.5">
      {field.fieldName}
      {field.unitId ? (
        <span className="text-[10px] muted">(unit #{field.unitId})</span>
      ) : null}
    </span>
  );
  const options = (field.options ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  switch (field.fieldType) {
    case "textarea":
      return (
        <Field label={label} required={field.required} error={error}>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          />
        </Field>
      );
    case "number":
    case "currency":
      return (
        <Field label={label} required={field.required} error={error}>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          />
        </Field>
      );
    case "date":
      return (
        <Field label={label} required={field.required} error={error}>
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          />
        </Field>
      );
    case "select":
      return (
        <Field label={label} required={field.required} error={error}>
          <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          >
            <option value="">— Select —</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "checkbox":
      return (
        <Field label={label} error={error}>
          <label className="inline-flex h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "false")}
              className="h-4 w-4"
            />
            <span className="text-sm">Yes</span>
          </label>
        </Field>
      );
    default:
      return (
        <Field label={label} required={field.required} error={error}>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            invalid={!!error}
          />
        </Field>
      );
  }
}
