"use client";

import { Briefcase } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { Project, ProjectStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_TONE: Record<ProjectStatus, "brand" | "info" | "success" | "warning" | "danger" | "neutral"> = {
  planned: "info",
  ongoing: "brand",
  completed: "success",
  on_hold: "warning",
  cancelled: "danger",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  ongoing: "Ongoing",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export default function ProjectsPage() {
  const { state } = useStore();
  return (
    <ResourcePage<Project>
      collection="projects"
      icon={<Briefcase className="h-5 w-5" />}
      title="Projects"
      subtitle="Programmes and initiatives being delivered by MDAs."
      singular="Project"
      plural="Projects"
      searchKeys={["name", "code", "description"]}
      modalSize="lg"
      columns={[
        {
          key: "name",
          header: "Project",
          sortBy: (r) => r.name,
          render: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              {r.code ? <div className="text-xs muted">{r.code}</div> : null}
            </div>
          ),
        },
        {
          key: "mda",
          header: "MDA",
          sortBy: (r) => state.mdas.find((m) => m.id === r.mdaId)?.name,
          render: (r) => (
            <Badge tone="brand">
              {state.mdas.find((m) => m.id === r.mdaId)?.code ?? "—"}
            </Badge>
          ),
        },
        {
          key: "status",
          header: "Status",
          sortBy: (r) => r.status,
          render: (r) => (
            <Badge tone={STATUS_TONE[r.status]} dot>
              {STATUS_LABEL[r.status]}
            </Badge>
          ),
        },
        {
          key: "dates",
          header: "Timeline",
          hidden: "md",
          sortBy: (r) => r.startDate,
          render: (r) =>
            r.startDate || r.endDate ? (
              <span className="muted text-xs">
                {formatDate(r.startDate)} → {formatDate(r.endDate)}
              </span>
            ) : (
              "—"
            ),
        },
        {
          key: "budget",
          header: "Budget",
          align: "right",
          sortBy: (r) => r.budget ?? 0,
          render: (r) => (
            <span className="tabular-nums">{formatCurrency(r.budget)}</span>
          ),
        },
        {
          key: "lgas",
          header: "LGAs",
          hidden: "lg",
          render: (r) => r.lgaIds.length,
        },
      ]}
      defaultValue={() => ({
        name: "",
        code: "",
        mdaId: state.mdas[0]?.id,
        description: "",
        status: "planned",
        startDate: "",
        endDate: "",
        budget: 0,
        lgaIds: [],
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.mdaId) e.mdaId = "MDA is required";
        if (v.startDate && v.endDate && v.startDate > v.endDate)
          e.endDate = "End date must be after start";
        return e;
      }}
      canDelete={(r) =>
        state.projectFundings.some((f) => f.projectId === r.id)
          ? "Remove project funding first."
          : state.targets.some((t) => t.projectId === r.id)
            ? "Remove project targets first."
            : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Name" required error={errors.name}>
                <Input
                  value={value.name ?? ""}
                  onChange={(e) => setField("name", e.target.value)}
                  invalid={!!errors.name}
                />
              </Field>
            </div>
            <Field label="Code">
              <Input
                value={value.code ?? ""}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                placeholder="HLTH-2024-01"
              />
            </Field>
          </div>
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
            <Field label="Status">
              <Select
                value={value.status ?? "planned"}
                onChange={(e) =>
                  setField("status", e.target.value as ProjectStatus)
                }
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <Field label="Budget (₦)">
              <Input
                type="number"
                min={0}
                value={value.budget ?? ""}
                onChange={(e) => setField("budget", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="LGAs covered">
            <select
              multiple
              value={value.lgaIds ?? []}
              onChange={(e) =>
                setField(
                  "lgaIds",
                  Array.from(e.target.selectedOptions).map((o) => o.value),
                )
              }
              className="block w-full rounded-lg border bg-[var(--surface)] p-2 text-sm min-h-[140px]"
            >
              {state.lgas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.state})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <Textarea
              value={value.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
            />
          </Field>
        </>
      )}
    />
  );
}
