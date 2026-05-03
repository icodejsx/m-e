"use client";

import { Briefcase } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DepartmentsApi, ProjectsApi } from "@/lib/api/endpoints";
import type {
  CreateProjectDto,
  DepartmentDto,
  ProjectDto,
} from "@/lib/api/types";
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

function departmentDisplayName(d: DepartmentDto): string {
  const n = (d.name ?? d.departmentName)?.trim();
  const title = n || `Department #${d.id}`;
  return d.code?.trim() ? `${title} (${d.code})` : title;
}

export default function ProjectsPage() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await DepartmentsApi.list({ page: 1, pageSize: 500 });
        const items = [...(res.items ?? [])].sort((a, b) =>
          departmentDisplayName(a).localeCompare(
            departmentDisplayName(b),
            undefined,
            { sensitivity: "base" },
          ),
        );
        if (!cancelled) setDepartments(items);
      } catch {
        if (!cancelled) setDepartments([]);
      } finally {
        if (!cancelled) setDeptLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  );

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        width: "80px",
        render: (r: ProjectDto) => (
          <span className="muted tabular-nums">#{r.id}</span>
        ),
        sortBy: (r: ProjectDto) => Number(r.id),
      },
      {
        key: "name",
        header: "Project",
        render: (r: ProjectDto) => (
          <div>
            <div className="font-medium">{r.projectName ?? "—"}</div>
            {r.description ? (
              <div className="mt-0.5 line-clamp-1 text-xs muted">
                {r.description}
              </div>
            ) : null}
          </div>
        ),
        sortBy: (r: ProjectDto) => r.projectName ?? "",
      },
      {
        key: "dept",
        header: "Department",
        hidden: "md" as const,
        render: (r: ProjectDto) => {
          const d = deptById.get(r.departmentId);
          return d ? (
            <span className="text-sm">{departmentDisplayName(d)}</span>
          ) : (
            <Badge tone="neutral">ID {r.departmentId}</Badge>
          );
        },
      },
      {
        key: "dates",
        header: "Dates",
        hidden: "lg" as const,
        render: (r: ProjectDto) => (
          <span className="muted text-xs">
            {formatDate(r.startDate)} → {formatDate(r.endDate)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (r: ProjectDto) => (
          <Badge tone={statusTone(r.status)}>{r.status ?? "—"}</Badge>
        ),
        sortBy: (r: ProjectDto) => r.status ?? "",
      },
    ],
    [deptById],
  );

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
        if (
          v.departmentId === undefined ||
          v.departmentId === null ||
          Number.isNaN(Number(v.departmentId))
        ) {
          e.departmentId = "Department is required";
        }
        if (!v.status) e.status = "Status is required";
        if (v.startDate && v.endDate && v.endDate < v.startDate)
          e.endDate = "End date must be after start date";
        return e;
      }}
      columns={columns}
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
            <Field label="Department" required error={errors.departmentId}>
              <Select
                value={
                  value.departmentId !== undefined &&
                  value.departmentId !== null
                    ? String(value.departmentId)
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  setField(
                    "departmentId",
                    raw === "" ? undefined : Number(raw),
                  );
                }}
                disabled={deptLoading}
                invalid={!!errors.departmentId}
              >
                <option value="">
                  {deptLoading
                    ? "Loading departments…"
                    : departments.length === 0
                      ? "No departments returned from API"
                      : "— Select department —"}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {departmentDisplayName(d)}
                  </option>
                ))}
              </Select>
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
