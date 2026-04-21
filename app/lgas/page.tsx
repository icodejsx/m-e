"use client";

import { MapPin } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { LGA } from "@/lib/types";

export default function LGAsPage() {
  return (
    <ResourcePage<LGA>
      collection="lgas"
      icon={<MapPin className="h-5 w-5" />}
      title="LGAs"
      subtitle="Local Government Areas used to tag projects and reports."
      singular="LGA"
      plural="LGAs"
      searchKeys={["name", "state", "code"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "state",
          header: "State",
          sortBy: (r) => r.state,
          render: (r) => <Badge tone="neutral">{r.state}</Badge>,
        },
        {
          key: "code",
          header: "Code",
          hidden: "md",
          sortBy: (r) => r.code,
          render: (r) => <span className="muted">{r.code ?? "—"}</span>,
        },
      ]}
      defaultValue={() => ({ name: "", state: "", code: "" })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.state?.trim()) e.state = "State is required";
        return e;
      }}
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
            <Field label="State" required error={errors.state}>
              <Input
                value={value.state ?? ""}
                onChange={(e) => setField("state", e.target.value)}
                invalid={!!errors.state}
              />
            </Field>
          </div>
          <Field label="Code">
            <Input
              value={value.code ?? ""}
              onChange={(e) => setField("code", e.target.value)}
              placeholder="e.g. NG-MN"
            />
          </Field>
        </>
      )}
    />
  );
}
