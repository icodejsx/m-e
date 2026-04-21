"use client";

import { Scale } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { Unit } from "@/lib/types";

export default function UnitsPage() {
  const { state } = useStore();
  return (
    <ResourcePage<Unit>
      collection="units"
      icon={<Scale className="h-5 w-5" />}
      title="Units of Measurement"
      subtitle="Units used for targets and indicator progress."
      singular="Unit"
      plural="Units"
      searchKeys={["name", "symbol", "description"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "symbol",
          header: "Symbol",
          sortBy: (r) => r.symbol,
          render: (r) => <Badge tone="brand">{r.symbol}</Badge>,
        },
        {
          key: "description",
          header: "Description",
          hidden: "md",
          render: (r) => <span className="muted">{r.description ?? "—"}</span>,
        },
      ]}
      defaultValue={() => ({ name: "", symbol: "", description: "" })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.symbol?.trim()) e.symbol = "Symbol is required";
        return e;
      }}
      canDelete={(r) =>
        state.targets.some((t) => t.unitId === r.id)
          ? "Targets use this unit; reassign them first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              <Input
                value={value.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                invalid={!!errors.name}
              />
            </Field>
            <Field label="Symbol" required error={errors.symbol}>
              <Input
                value={value.symbol ?? ""}
                onChange={(e) => setField("symbol", e.target.value)}
                invalid={!!errors.symbol}
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={value.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
            />
          </Field>
        </>
      )}
    />
  );
}
