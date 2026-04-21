"use client";

import { Network } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { Department } from "@/lib/types";

export default function DepartmentsPage() {
  const { state } = useStore();

  return (
    <ResourcePage<Department>
      collection="departments"
      icon={<Network className="h-5 w-5" />}
      title="Departments / Agencies"
      subtitle="Operating units that roll up to an MDA."
      singular="Department"
      plural="Departments"
      searchKeys={["name", "code", "head"]}
      columns={[
        {
          key: "name",
          header: "Department",
          sortBy: (r) => r.name,
          render: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              {r.code ? (
                <div className="text-xs muted">{r.code}</div>
              ) : null}
            </div>
          ),
        },
        {
          key: "mda",
          header: "MDA",
          sortBy: (r) => state.mdas.find((m) => m.id === r.mdaId)?.name ?? "",
          render: (r) => {
            const mda = state.mdas.find((m) => m.id === r.mdaId);
            return mda ? <Badge tone="brand">{mda.code}</Badge> : "—";
          },
        },
        {
          key: "head",
          header: "Head",
          hidden: "md",
          sortBy: (r) => r.head,
          render: (r) => r.head ?? "—",
        },
      ]}
      defaultValue={() => ({
        name: "",
        mdaId: state.mdas[0]?.id,
        code: "",
        head: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.mdaId) e.mdaId = "MDA is required";
        return e;
      }}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="MDA" required error={errors.mdaId}>
            <Select
              value={value.mdaId ?? ""}
              onChange={(e) => setField("mdaId", e.target.value)}
              invalid={!!errors.mdaId}
            >
              <option value="">— Select MDA —</option>
              {state.mdas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Primary Healthcare Board"
              invalid={!!errors.name}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code">
              <Input
                value={value.code ?? ""}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Department Head">
              <Input
                value={value.head ?? ""}
                onChange={(e) => setField("head", e.target.value)}
              />
            </Field>
          </div>
        </>
      )}
    />
  );
}
