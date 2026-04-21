"use client";

import { Target as TargetIcon } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { useStore } from "@/lib/store";
import type { Target } from "@/lib/types";

export default function TargetsPage() {
  const { state } = useStore();

  function latestProgress(targetId: string, baseline: number): number {
    const rows = state.targetProgress
      .filter((p) => p.targetId === targetId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    return rows.length ? rows[rows.length - 1].value : baseline;
  }

  return (
    <ResourcePage<Target>
      collection="targets"
      icon={<TargetIcon className="h-5 w-5" />}
      title="Targets"
      subtitle="Outcome and output targets tracked over reporting periods."
      singular="Target"
      plural="Targets"
      searchKeys={["name", "description"]}
      modalSize="lg"
      columns={[
        {
          key: "name",
          header: "Target",
          sortBy: (r) => r.name,
          render: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Badge tone="brand">
                  {state.mdas.find((m) => m.id === r.mdaId)?.code ?? "—"}
                </Badge>
                {r.projectId ? (
                  <span className="text-xs muted truncate">
                    {state.projects.find((p) => p.id === r.projectId)?.name}
                  </span>
                ) : null}
              </div>
            </div>
          ),
        },
        {
          key: "progress",
          header: "Progress",
          sortBy: (r) => {
            const cur = latestProgress(r.id, r.baseline);
            return r.target ? (cur / r.target) * 100 : 0;
          },
          render: (r) => {
            const cur = latestProgress(r.id, r.baseline);
            const unit = state.units.find((u) => u.id === r.unitId);
            const pct = r.target ? (cur / r.target) * 100 : 0;
            const tone = pct >= 90 ? "emerald" : pct >= 50 ? "brand" : pct >= 25 ? "amber" : "rose";
            return (
              <div className="min-w-[200px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="muted">
                    {cur.toLocaleString()} / {r.target.toLocaleString()} {unit?.symbol ?? ""}
                  </span>
                  <span className="muted tabular-nums">{pct.toFixed(0)}%</span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={pct} tone={tone} />
                </div>
              </div>
            );
          },
        },
        {
          key: "period",
          header: "Period",
          hidden: "lg",
          sortBy: (r) => state.reportingPeriods.find((p) => p.id === r.periodId)?.name,
          render: (r) => state.reportingPeriods.find((p) => p.id === r.periodId)?.name ?? "—",
        },
      ]}
      defaultValue={() => ({
        name: "",
        mdaId: state.mdas[0]?.id,
        unitId: state.units[0]?.id,
        periodId: state.activePeriodId ?? state.reportingPeriods[0]?.id,
        baseline: 0,
        target: 0,
        projectId: undefined,
        description: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.mdaId) e.mdaId = "MDA is required";
        if (!v.unitId) e.unitId = "Unit is required";
        if (!v.periodId) e.periodId = "Period is required";
        if (v.target === undefined || v.target === null) e.target = "Target value required";
        else if (Number(v.target) <= 0) e.target = "Target must be positive";
        return e;
      }}
      canDelete={(r) =>
        state.targetProgress.some((p) => p.targetId === r.id)
          ? "Remove progress entries for this target first."
          : null
      }
      renderForm={({ value, setField, errors }) => {
        const projectsForMda = value.mdaId
          ? state.projects.filter((p) => p.mdaId === value.mdaId)
          : state.projects;
        return (
          <>
            <Field label="Target name" required error={errors.name}>
              <Input
                value={value.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                invalid={!!errors.name}
                placeholder="e.g. Children immunised"
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
              <Field label="Project (optional)">
                <Select
                  value={value.projectId ?? ""}
                  onChange={(e) =>
                    setField("projectId", e.target.value || undefined)
                  }
                >
                  <option value="">— None —</option>
                  {projectsForMda.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Unit" required error={errors.unitId}>
                <Select
                  value={value.unitId ?? ""}
                  onChange={(e) => setField("unitId", e.target.value)}
                  invalid={!!errors.unitId}
                >
                  <option value="">— Select —</option>
                  {state.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Baseline">
                <Input
                  type="number"
                  value={value.baseline ?? 0}
                  onChange={(e) => setField("baseline", Number(e.target.value))}
                />
              </Field>
              <Field label="Target" required error={errors.target}>
                <Input
                  type="number"
                  value={value.target ?? 0}
                  onChange={(e) => setField("target", Number(e.target.value))}
                  invalid={!!errors.target}
                />
              </Field>
            </div>
            <Field label="Period" required error={errors.periodId}>
              <Select
                value={value.periodId ?? ""}
                onChange={(e) => setField("periodId", e.target.value)}
                invalid={!!errors.periodId}
              >
                {state.reportingPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description">
              <Textarea
                value={value.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
              />
            </Field>
          </>
        );
      }}
    />
  );
}
