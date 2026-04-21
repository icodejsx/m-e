"use client";

import { UserCog } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { Assignment } from "@/lib/types";

export default function AssignmentsPage() {
  const { state } = useStore();

  return (
    <ResourcePage<Assignment>
      collection="assignments"
      icon={<UserCog className="h-5 w-5" />}
      title="User Assignments"
      subtitle="Scope users to MDAs/Departments and the report types they're allowed to submit."
      singular="Assignment"
      plural="Assignments"
      columns={[
        {
          key: "user",
          header: "User",
          sortBy: (r) => state.users.find((u) => u.id === r.userId)?.name,
          render: (r) => {
            const u = state.users.find((x) => x.id === r.userId);
            return u ? (
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs muted">{u.email}</div>
              </div>
            ) : (
              "—"
            );
          },
        },
        {
          key: "scope",
          header: "Scope",
          render: (r) => {
            const mda = state.mdas.find((m) => m.id === r.mdaId);
            const dept = state.departments.find((d) => d.id === r.departmentId);
            return (
              <div className="flex flex-wrap gap-1">
                {mda ? <Badge tone="brand">{mda.code}</Badge> : null}
                {dept ? <Badge tone="info">{dept.name}</Badge> : null}
                {!mda && !dept ? <span className="muted">—</span> : null}
              </div>
            );
          },
        },
        {
          key: "reportTypes",
          header: "Report types",
          render: (r) => (
            <div className="flex flex-wrap gap-1">
              {r.reportTypeIds.length === 0 ? (
                <span className="muted text-xs">—</span>
              ) : (
                r.reportTypeIds.slice(0, 3).map((id) => {
                  const t = state.reportTypes.find((x) => x.id === id);
                  return t ? (
                    <Badge key={id} tone="violet">
                      {t.name}
                    </Badge>
                  ) : null;
                })
              )}
              {r.reportTypeIds.length > 3 ? (
                <Badge tone="neutral">+{r.reportTypeIds.length - 3}</Badge>
              ) : null}
            </div>
          ),
        },
      ]}
      defaultValue={() => ({
        userId: state.users.find((u) => u.role === "reporting_officer")?.id,
        mdaId: undefined,
        departmentId: undefined,
        reportTypeIds: [],
        note: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.userId) e.userId = "Pick a user";
        if (!v.mdaId && !v.departmentId)
          e.mdaId = "Assign an MDA or department";
        return e;
      }}
      renderForm={({ value, setField, errors }) => {
        const deptsForMda = value.mdaId
          ? state.departments.filter((d) => d.mdaId === value.mdaId)
          : state.departments;
        return (
          <>
            <Field label="User" required error={errors.userId}>
              <Select
                value={value.userId ?? ""}
                onChange={(e) => setField("userId", e.target.value)}
                invalid={!!errors.userId}
              >
                <option value="">— Select user —</option>
                {state.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="MDA" required error={errors.mdaId}>
                <Select
                  value={value.mdaId ?? ""}
                  onChange={(e) => setField("mdaId", e.target.value || undefined)}
                  invalid={!!errors.mdaId}
                >
                  <option value="">— Any —</option>
                  {state.mdas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department">
                <Select
                  value={value.departmentId ?? ""}
                  onChange={(e) =>
                    setField("departmentId", e.target.value || undefined)
                  }
                >
                  <option value="">— Any —</option>
                  {deptsForMda.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field
              label="Report types"
              hint="Hold Cmd/Ctrl to select multiple. Leave empty to allow all types."
            >
              <select
                multiple
                value={value.reportTypeIds ?? []}
                onChange={(e) =>
                  setField(
                    "reportTypeIds",
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
                className="block w-full rounded-lg border bg-[var(--surface)] p-2 text-sm min-h-[120px]"
              >
                {state.reportTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Note">
              <Input
                value={value.note ?? ""}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="Optional note about this assignment"
              />
            </Field>
          </>
        );
      }}
    />
  );
}
