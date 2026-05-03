"use client";

import { Banknote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProjectsApi } from "@/lib/api/endpoints";
import type { ProjectDto } from "@/lib/api/types";
import { useStore } from "@/lib/store";
import type { ID, ProjectFunding } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function resolveProject(
  apiProjects: ProjectDto[],
  projectId: ID,
): ProjectDto | undefined {
  return apiProjects.find((p) => String(p.id) === String(projectId));
}

export default function ProjectFundingPage() {
  const { state } = useStore();
  const [apiProjects, setApiProjects] = useState<ProjectDto[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ProjectsApi.list({ page: 1, pageSize: 1000 });
        const items = [...(res.items ?? [])].sort((a, b) =>
          String(a.projectName ?? "").localeCompare(
            String(b.projectName ?? ""),
            undefined,
            { sensitivity: "base" },
          ),
        );
        if (!cancelled) setApiProjects(items);
      } catch {
        if (!cancelled) setApiProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "project",
        header: "Project",
        sortBy: (r: ProjectFunding) =>
          resolveProject(apiProjects, r.projectId)?.projectName ?? "",
        render: (r: ProjectFunding) => {
          const p = resolveProject(apiProjects, r.projectId);
          return p ? (
            <div>
              <div className="font-medium">{p.projectName ?? "—"}</div>
              {p.description ? (
                <div className="mt-0.5 line-clamp-1 text-xs muted">
                  {p.description}
                </div>
              ) : null}
            </div>
          ) : (
            <span className="muted">Unknown project (ID {r.projectId})</span>
          );
        },
      },
      {
        key: "source",
        header: "Source",
        sortBy: (r: ProjectFunding) =>
          state.fundingSources.find((s) => s.id === r.sourceId)?.name,
        render: (r: ProjectFunding) => {
          const s = state.fundingSources.find((x) => x.id === r.sourceId);
          return s ? (
            <Badge
              tone={
                s.kind === "donor"
                  ? "violet"
                  : s.kind === "government"
                    ? "brand"
                    : s.kind === "internal"
                      ? "info"
                      : "neutral"
              }
            >
              {s.name}
            </Badge>
          ) : (
            "—"
          );
        },
      },
      {
        key: "amount",
        header: "Amount",
        align: "right" as const,
        sortBy: (r: ProjectFunding) => r.amount,
        render: (r: ProjectFunding) => (
          <span className="tabular-nums font-medium">
            {formatCurrency(r.amount, r.currency)}
          </span>
        ),
      },
      {
        key: "currency",
        header: "Currency",
        hidden: "md" as const,
        sortBy: (r: ProjectFunding) => r.currency,
        render: (r: ProjectFunding) => r.currency,
      },
      {
        key: "note",
        header: "Note",
        hidden: "lg" as const,
        render: (r: ProjectFunding) => (
          <span className="muted">{r.note ?? "—"}</span>
        ),
      },
    ],
    [apiProjects, state.fundingSources],
  );

  return (
    <ResourcePage<ProjectFunding>
      collection="projectFundings"
      icon={<Banknote className="h-5 w-5" />}
      title="Project Funding"
      subtitle="Allocations from funding sources to projects (projects loaded from the API)."
      singular="Funding entry"
      plural="Funding entries"
      columns={columns}
      defaultValue={() => ({
        projectId:
          apiProjects[0]?.id !== undefined
            ? String(apiProjects[0].id)
            : undefined,
        sourceId: state.fundingSources[0]?.id,
        amount: 0,
        currency: "NGN",
        note: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.projectId) e.projectId = "Project is required";
        if (!v.sourceId) e.sourceId = "Source is required";
        if (!v.amount || v.amount <= 0)
          e.amount = "Amount must be greater than 0";
        return e;
      }}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Project" required error={errors.projectId}>
            <Select
              value={value.projectId ?? ""}
              onChange={(e) => setField("projectId", e.target.value)}
              disabled={projectsLoading}
              invalid={!!errors.projectId}
            >
              <option value="">
                {projectsLoading
                  ? "Loading projects…"
                  : apiProjects.length === 0
                    ? "No projects returned from API"
                    : "— Select project —"}
              </option>
              {apiProjects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.projectName ?? `Project #${p.id}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Funding source" required error={errors.sourceId}>
            <Select
              value={value.sourceId ?? ""}
              onChange={(e) => setField("sourceId", e.target.value)}
              invalid={!!errors.sourceId}
            >
              <option value="">— Select source —</option>
              {state.fundingSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Amount" required error={errors.amount}>
                <Input
                  type="number"
                  min={0}
                  value={value.amount ?? ""}
                  onChange={(e) => setField("amount", Number(e.target.value))}
                  invalid={!!errors.amount}
                />
              </Field>
            </div>
            <Field label="Currency">
              <Select
                value={value.currency ?? "NGN"}
                onChange={(e) => setField("currency", e.target.value)}
              >
                <option value="NGN">NGN – Naira</option>
                <option value="USD">USD – Dollar</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GBP">GBP – Pound</option>
              </Select>
            </Field>
          </div>
          <Field label="Note">
            <Input
              value={value.note ?? ""}
              onChange={(e) => setField("note", e.target.value)}
            />
          </Field>
        </>
      )}
    />
  );
}
