"use client";

import { Target as TargetIcon } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TargetsApi } from "@/lib/api/endpoints";
import { useReports, useProjects } from "@/lib/api/hooks";
import type { CreateTargetDto, TargetDto } from "@/lib/api/types";

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually"];

export default function TargetsPage() {
  const { data: reports } = useReports();
  const { data: projects } = useProjects();

  return (
    <RemoteResourcePage<TargetDto, CreateTargetDto>
      icon={<TargetIcon className="h-5 w-5" />}
      title="Targets"
      subtitle="Quantified targets linked to exactly one report or project."
      singular="Target"
      modalSize="lg"
      fetchPage={({ page, pageSize }) =>
        TargetsApi.list({ page, pageSize })
      }
      create={(v) => TargetsApi.create(prepare(v))}
      update={(id, v) => TargetsApi.update(id, prepare(v))}
      remove={(id) => TargetsApi.remove(id)}
      toFormValue={(r) => ({
        targetName: r.targetName ?? "",
        reportId: r.reportId ?? null,
        projectId: r.projectId ?? null,
        reportingPeriodId: r.reportingPeriodId,
        lgaId: r.lgaId,
        value: r.value,
        unitId: r.unitId,
        frequency: r.frequency ?? "Monthly",
      })}
      defaultValue={() => ({
        targetName: "",
        value: 0,
        frequency: "Monthly",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.targetName?.trim()) e.targetName = "Target name is required";
        if (!v.frequency) e.frequency = "Frequency is required";
        const hasReport = v.reportId != null && v.reportId !== ("" as unknown as number);
        const hasProject = v.projectId != null && v.projectId !== ("" as unknown as number);
        if (!hasReport && !hasProject)
          e.reportId = "Link to either a report or a project";
        if (hasReport && hasProject)
          e.reportId = "Provide only one of report or project";
        return e;
      }}
      columns={[
        {
          key: "id",
          header: "ID",
          width: "80px",
          render: (r) => <span className="muted tabular-nums">#{r.id}</span>,
          sortBy: (r) => Number(r.id),
        },
        {
          key: "name",
          header: "Target",
          render: (r) => (
            <div>
              <div className="font-medium">{r.targetName ?? "—"}</div>
              <div className="mt-0.5 text-xs muted">
                {r.reportId
                  ? `Report: ${reports.find((rr) => rr.id === r.reportId)?.reportName ?? `#${r.reportId}`}`
                  : r.projectId
                    ? `Project: ${projects.find((pp) => pp.id === r.projectId)?.projectName ?? `#${r.projectId}`}`
                    : "—"}
              </div>
            </div>
          ),
          sortBy: (r) => r.targetName ?? "",
        },
        {
          key: "value",
          header: "Value",
          hidden: "md",
          render: (r) => (
            <span className="tabular-nums">{r.value.toLocaleString()}</span>
          ),
          sortBy: (r) => r.value,
        },
        {
          key: "period",
          header: "Period",
          hidden: "md",
          render: (r) => <Badge tone="neutral">Period #{r.reportingPeriodId}</Badge>,
        },
        {
          key: "lga",
          header: "LGA",
          hidden: "lg",
          render: (r) => <Badge tone="neutral">LGA #{r.lgaId}</Badge>,
        },
        {
          key: "unit",
          header: "Unit",
          hidden: "lg",
          render: (r) => <Badge tone="neutral">Unit #{r.unitId}</Badge>,
        },
        {
          key: "frequency",
          header: "Freq.",
          render: (r) => <Badge tone="info">{r.frequency ?? "—"}</Badge>,
        },
      ]}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Target name" required error={errors.targetName}>
            <Input
              value={value.targetName ?? ""}
              onChange={(e) => setField("targetName", e.target.value)}
              invalid={!!errors.targetName}
              maxLength={256}
              placeholder="e.g. Children immunised"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Link to report" error={errors.reportId}>
              <Select
                value={value.reportId ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setField("reportId", n || null);
                  if (n) setField("projectId", null);
                }}
                invalid={!!errors.reportId}
              >
                <option value="">— None —</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reportName} (#{r.id})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Link to project">
              <Select
                value={value.projectId ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setField("projectId", n || null);
                  if (n) setField("reportId", null);
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Value">
              <Input
                type="number"
                step="any"
                value={value.value ?? ""}
                onChange={(e) =>
                  setField("value", Number(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Unit ID">
              <Input
                type="number"
                min={1}
                value={value.unitId ?? ""}
                onChange={(e) =>
                  setField("unitId", Number(e.target.value) || undefined)
                }
                placeholder="1"
              />
            </Field>
            <Field label="Frequency" required error={errors.frequency}>
              <Select
                value={value.frequency ?? ""}
                onChange={(e) => setField("frequency", e.target.value)}
                invalid={!!errors.frequency}
              >
                <option value="">— Select —</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Reporting period ID">
              <Input
                type="number"
                min={1}
                value={value.reportingPeriodId ?? ""}
                onChange={(e) =>
                  setField(
                    "reportingPeriodId",
                    Number(e.target.value) || undefined,
                  )
                }
                placeholder="1"
              />
            </Field>
            <Field label="LGA ID">
              <Input
                type="number"
                min={1}
                value={value.lgaId ?? ""}
                onChange={(e) =>
                  setField("lgaId", Number(e.target.value) || undefined)
                }
                placeholder="1"
              />
            </Field>
          </div>
        </>
      )}
    />
  );
}

function prepare(v: CreateTargetDto): CreateTargetDto {
  return {
    ...v,
    reportId: v.reportId || null,
    projectId: v.projectId || null,
    value: Number(v.value ?? 0),
  };
}
