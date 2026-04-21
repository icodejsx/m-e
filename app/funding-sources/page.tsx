"use client";

import { Landmark } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { FundingSource } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const KIND_TONE = {
  government: "brand",
  donor: "violet",
  internal: "info",
  other: "neutral",
} as const;

export default function FundingSourcesPage() {
  const { state } = useStore();

  return (
    <ResourcePage<FundingSource>
      collection="fundingSources"
      icon={<Landmark className="h-5 w-5" />}
      title="Funding Sources"
      subtitle="Where project funds come from: government, donors, internal, etc."
      singular="Funding source"
      plural="Funding sources"
      searchKeys={["name", "description"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "kind",
          header: "Type",
          sortBy: (r) => r.kind,
          render: (r) => (
            <Badge tone={KIND_TONE[r.kind]} dot>
              {r.kind}
            </Badge>
          ),
        },
        {
          key: "total",
          header: "Total funding",
          hidden: "md",
          align: "right",
          sortBy: (r) =>
            state.projectFundings
              .filter((f) => f.sourceId === r.id)
              .reduce((a, b) => a + b.amount, 0),
          render: (r) => (
            <span className="tabular-nums">
              {formatCurrency(
                state.projectFundings
                  .filter((f) => f.sourceId === r.id)
                  .reduce((a, b) => a + b.amount, 0),
              )}
            </span>
          ),
        },
      ]}
      defaultValue={() => ({ name: "", kind: "government", description: "" })}
      validate={(v) => ({
        ...(v.name?.trim() ? {} : { name: "Name is required" }),
      })}
      canDelete={(r) =>
        state.projectFundings.some((f) => f.sourceId === r.id)
          ? "Remove linked project funding first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              invalid={!!errors.name}
            />
          </Field>
          <Field label="Type">
            <Select
              value={value.kind ?? "government"}
              onChange={(e) =>
                setField("kind", e.target.value as FundingSource["kind"])
              }
            >
              <option value="government">Government</option>
              <option value="donor">Donor / Partner</option>
              <option value="internal">Internal / Earned</option>
              <option value="other">Other</option>
            </Select>
          </Field>
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
