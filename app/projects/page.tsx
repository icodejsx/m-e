"use client";

import { Briefcase } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProjectsApi } from "@/lib/api/endpoints";
import type { CreateProjectDto, ProjectDto } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

const STATUSES = [
  "Planned",
  "Ongoing",
  "Completed",
  "OnHold",
  "Cancelled",
];

function toInputDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toIsoDate(val?: string) {
  if (!val) return undefined;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function ProjectsPage() {
  return (
    <RemoteResourcePage<ProjectDto, CreateProjectDto>
      icon={<Briefcase className="h-5 w-5" />}
      title="Projects"
      subtitle="Programmes and projects tracked across departments."
      singular="Project"
      modalSize="lg"
      fetchPage={({ page, pageSize }) =>
        ProjectsApi.list({ page, pageSize })
      }
      create={(v) => ProjectsApi.create(normalize(v))}
      update={(id, v) => ProjectsApi.update(id, normalize(v))}
      remove={(id) => ProjectsApi.remove(id)}
      toFormValue={(r) => ({
        projectName: r.projectName ?? "",
        departmentId: r.departmentId,
        description: r.description ?? "",
        startDate: toInputDate(r.startDate),
        endDate: toInputDate(r.endDate),
        status: r.status ?? "Planned",
      })}
      defaultValue={() => ({
        projectName: "",
        status: "Planned",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.projectName?.trim())
          e.projectName = "Project name is required";
        if (!v.status) e.status = "Status is required";
        if (v.startDate && v.endDate && v.endDate < v.startDate)
          e.endDate = "End date must be after start date";
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
          header: "Project",
          render: (r) => (
            <div>
              <div className="font-medium">{r.projectName ?? "—"}</div>
              {r.description ? (
                <div className="mt-0.5 line-clamp-1 text-xs muted">
                  {r.description}
                </div>
              ) : null}
            </div>
          ),
          sortBy: (r) => r.projectName ?? "",
        },
        {
          key: "dept",
          header: "Dept.",
          hidden: "md",
          render: (r) => <Badge tone="brand">#{r.departmentId}</Badge>,
        },
        {
          key: "dates",
          header: "Dates",
          hidden: "lg",
          render: (r) => (
            <span className="muted text-xs">
              {formatDate(r.startDate)} → {formatDate(r.endDate)}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <Badge tone={statusTone(r.status)}>{r.status ?? "—"}</Badge>
          ),
          sortBy: (r) => r.status ?? "",
        },
      ]}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Project name" required error={errors.projectName}>
            <Input
              value={value.projectName ?? ""}
              onChange={(e) => setField("projectName", e.target.value)}
              invalid={!!errors.projectName}
              maxLength={256}
              placeholder="e.g. PHC Revitalisation Programme"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={value.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Department ID">
              <Input
                type="number"
                min={1}
                value={value.departmentId ?? ""}
                onChange={(e) =>
                  setField(
                    "departmentId",
                    Number(e.target.value) || undefined,
                  )
                }
                placeholder="1"
              />
            </Field>
            <Field label="Start date">
              <Input
                type="date"
                value={value.startDate ?? ""}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </Field>
            <Field label="End date" error={errors.endDate}>
              <Input
                type="date"
                value={value.endDate ?? ""}
                onChange={(e) => setField("endDate", e.target.value)}
                invalid={!!errors.endDate}
              />
            </Field>
          </div>
          <Field label="Status" required error={errors.status}>
            <Select
              value={value.status ?? ""}
              onChange={(e) => setField("status", e.target.value)}
              invalid={!!errors.status}
            >
              <option value="">— Select —</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
    />
  );
}

function normalize(v: CreateProjectDto): CreateProjectDto {
  return {
    ...v,
    startDate: toIsoDate(v.startDate),
    endDate: toIsoDate(v.endDate),
  };
}

function statusTone(
  s: string | null,
): "success" | "info" | "warning" | "danger" | "neutral" {
  switch ((s ?? "").toLowerCase()) {
    case "completed":
      return "success";
    case "ongoing":
      return "info";
    case "onhold":
    case "on_hold":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}
