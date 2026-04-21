"use client";

import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/RowActions";
import { Button } from "@/components/ui/Button";
import { useModal } from "@/lib/modal";
import { useStore } from "@/lib/store";
import type { Report, ReportStatus } from "@/lib/types";
import { formatDate, relativeFromNow } from "@/lib/utils";

const STATUS_TONE: Record<ReportStatus, "warning" | "info" | "success" | "danger"> = {
  draft: "warning",
  submitted: "info",
  approved: "success",
  rejected: "danger",
};

export default function ReportsPage() {
  const { state } = useStore();
  const modal = useModal();

  function openValues(r: Report) {
    const template = state.templates.find((t) => t.id === r.templateId);
    modal.open({
      title: r.title,
      subtitle: "Report details",
      size: "lg",
      body: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Meta
              label="MDA"
              value={state.mdas.find((m) => m.id === r.mdaId)?.name ?? "—"}
            />
            <Meta
              label="Type"
              value={state.reportTypes.find((t) => t.id === r.typeId)?.name ?? "—"}
            />
            <Meta
              label="Period"
              value={
                state.reportingPeriods.find((p) => p.id === r.periodId)?.name ??
                "—"
              }
            />
            <Meta
              label="Status"
              value={
                <Badge tone={STATUS_TONE[r.status]} dot>
                  {r.status}
                </Badge>
              }
            />
          </div>
          {template ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide muted">
                Captured values
              </div>
              <div className="divide-y rounded-xl border">
                {template.fields.map((f) => {
                  const v = r.values?.[f.key];
                  return (
                    <div
                      key={f.id}
                      className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="text-xs muted">{f.label}</div>
                      <div className="text-sm break-words">
                        {v === undefined || v === null || v === "" ? (
                          <span className="muted">—</span>
                        ) : Array.isArray(v) ? (
                          v.join(", ")
                        ) : (
                          String(v)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {r.notes ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide muted">
                Notes
              </div>
              <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap">
                {r.notes}
              </div>
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => modal.close()}>
              Close
            </Button>
          </div>
        </div>
      ),
    });
  }

  return (
    <ResourcePage<Report>
      collection="reports"
      icon={<FileText className="h-5 w-5" />}
      title="Reports"
      subtitle="Submitted reports captured against report types and periods."
      singular="Report"
      plural="Reports"
      searchKeys={["title", "notes"]}
      modalSize="lg"
      additionalActions={
        <Link
          href="/capture"
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
        >
          Capture from template
        </Link>
      }
      columns={[
        {
          key: "title",
          header: "Report",
          sortBy: (r) => r.title,
          render: (r) => (
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs muted">
                <span>{state.reportTypes.find((t) => t.id === r.typeId)?.name ?? "—"}</span>
                <span>•</span>
                <span>{relativeFromNow(r.updatedAt)}</span>
              </div>
            </div>
          ),
        },
        {
          key: "mda",
          header: "MDA",
          sortBy: (r) => state.mdas.find((m) => m.id === r.mdaId)?.name,
          hidden: "md",
          render: (r) => (
            <Badge tone="brand">
              {state.mdas.find((m) => m.id === r.mdaId)?.code ?? "—"}
            </Badge>
          ),
        },
        {
          key: "period",
          header: "Period",
          hidden: "md",
          sortBy: (r) => state.reportingPeriods.find((p) => p.id === r.periodId)?.name,
          render: (r) =>
            state.reportingPeriods.find((p) => p.id === r.periodId)?.name ?? "—",
        },
        {
          key: "status",
          header: "Status",
          sortBy: (r) => r.status,
          render: (r) => (
            <Badge tone={STATUS_TONE[r.status]} dot>
              {r.status}
            </Badge>
          ),
        },
        {
          key: "submitted",
          header: "Submitted",
          hidden: "lg",
          render: (r) =>
            r.submittedAt ? (
              <span className="muted text-xs">{formatDate(r.submittedAt)}</span>
            ) : (
              <span className="muted text-xs">—</span>
            ),
        },
      ]}
      defaultValue={() => ({
        title: "",
        mdaId: state.mdas[0]?.id,
        typeId: state.reportTypes[0]?.id,
        periodId: state.activePeriodId ?? state.reportingPeriods[0]?.id,
        status: "draft",
        submittedBy: state.activeUserId ?? undefined,
        values: {},
        notes: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.title?.trim()) e.title = "Title is required";
        if (!v.mdaId) e.mdaId = "MDA is required";
        if (!v.typeId) e.typeId = "Report type is required";
        if (!v.periodId) e.periodId = "Period is required";
        return e;
      }}
      rowActions={(r) => (
        <IconButton onClick={() => openValues(r)} title="View details">
          <Eye className="h-3.5 w-3.5" />
        </IconButton>
      )}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Title" required error={errors.title}>
            <Input
              value={value.title ?? ""}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. PHC Monthly Service – July"
              invalid={!!errors.title}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MDA" required error={errors.mdaId}>
              <Select
                value={value.mdaId ?? ""}
                onChange={(e) => setField("mdaId", e.target.value)}
                invalid={!!errors.mdaId}
              >
                <option value="">— Select —</option>
                {state.mdas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Report type" required error={errors.typeId}>
              <Select
                value={value.typeId ?? ""}
                onChange={(e) => setField("typeId", e.target.value)}
                invalid={!!errors.typeId}
              >
                <option value="">— Select —</option>
                {state.reportTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Period" required error={errors.periodId}>
              <Select
                value={value.periodId ?? ""}
                onChange={(e) => setField("periodId", e.target.value)}
                invalid={!!errors.periodId}
              >
                <option value="">— Select —</option>
                {state.reportingPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={value.status ?? "draft"}
                onChange={(e) =>
                  setField("status", e.target.value as ReportStatus)
                }
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              value={value.notes ?? ""}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
            />
          </Field>
        </>
      )}
    />
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide muted">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
