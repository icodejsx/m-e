"use client";

import { Building2 } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { MDA } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MDAsPage() {
  const { state } = useStore();

  return (
    <ResourcePage<MDA>
      collection="mdas"
      icon={<Building2 className="h-5 w-5" />}
      title="MDAs"
      subtitle="Ministries, Departments and Agencies participating in reporting."
      singular="MDA"
      plural="MDAs"
      searchKeys={["name", "code", "description"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              {r.description ? (
                <div className="text-xs muted line-clamp-1">{r.description}</div>
              ) : null}
            </div>
          ),
        },
        {
          key: "code",
          header: "Code",
          sortBy: (r) => r.code,
          render: (r) => <Badge tone="brand">{r.code}</Badge>,
        },
        {
          key: "departments",
          header: "Departments",
          hidden: "md",
          render: (r) => state.departments.filter((d) => d.mdaId === r.id).length,
          sortBy: (r) => state.departments.filter((d) => d.mdaId === r.id).length,
        },
        {
          key: "projects",
          header: "Projects",
          hidden: "lg",
          render: (r) => state.projects.filter((p) => p.mdaId === r.id).length,
          sortBy: (r) => state.projects.filter((p) => p.mdaId === r.id).length,
        },
        {
          key: "updatedAt",
          header: "Updated",
          hidden: "lg",
          sortBy: (r) => r.updatedAt,
          render: (r) => (
            <span className="text-xs muted">{formatDate(r.updatedAt)}</span>
          ),
        },
      ]}
      defaultValue={() => ({ name: "", code: "", description: "" })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.code?.trim()) e.code = "Code is required";
        else if (
          state.mdas.some(
            (m) => m.code.toLowerCase() === v.code!.toLowerCase() && m.id !== (v as MDA).id,
          )
        )
          e.code = "Code must be unique";
        return e;
      }}
      canDelete={(r) => {
        if (state.departments.some((d) => d.mdaId === r.id))
          return "Remove associated departments first.";
        if (state.projects.some((p) => p.mdaId === r.id))
          return "Remove associated projects first.";
        if (state.reports.some((p) => p.mdaId === r.id))
          return "Remove associated reports first.";
        return null;
      }}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Ministry of Health"
              invalid={!!errors.name}
            />
          </Field>
          <Field label="Code" required error={errors.code} hint="Short unique code, e.g. MOH">
            <Input
              value={value.code ?? ""}
              onChange={(e) => setField("code", e.target.value.toUpperCase())}
              placeholder="MOH"
              invalid={!!errors.code}
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={value.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="What does this MDA oversee?"
            />
          </Field>
        </>
      )}
    />
  );
}
