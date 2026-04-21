"use client";

import { Banknote } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { ProjectFunding } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function ProjectFundingPage() {
  const { state } = useStore();
  return (
    <ResourcePage<ProjectFunding>
      collection="projectFundings"
      icon={<Banknote className="h-5 w-5" />}
      title="Project Funding"
      subtitle="Allocations from funding sources to projects."
      singular="Funding entry"
      plural="Funding entries"
      columns={[
        {
          key: "project",
          header: "Project",
          sortBy: (r) => state.projects.find((p) => p.id === r.projectId)?.name,
          render: (r) => {
            const p = state.projects.find((x) => x.id === r.projectId);
            return p ? (
              <div>
                <div className="font-medium">{p.name}</div>
                {p.code ? <div className="text-xs muted">{p.code}</div> : null}
              </div>
            ) : (
              "—"
            );
          },
        },
        {
          key: "source",
          header: "Source",
          sortBy: (r) => state.fundingSources.find((s) => s.id === r.sourceId)?.name,
          render: (r) => {
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
          align: "right",
          sortBy: (r) => r.amount,
          render: (r) => (
            <span className="tabular-nums font-medium">
              {formatCurrency(r.amount, r.currency)}
            </span>
          ),
        },
        {
          key: "currency",
          header: "Currency",
          hidden: "md",
          sortBy: (r) => r.currency,
          render: (r) => r.currency,
        },
        {
          key: "note",
          header: "Note",
          hidden: "lg",
          render: (r) => <span className="muted">{r.note ?? "—"}</span>,
        },
      ]}
      defaultValue={() => ({
        projectId: state.projects[0]?.id,
        sourceId: state.fundingSources[0]?.id,
        amount: 0,
        currency: "NGN",
        note: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.projectId) e.projectId = "Project is required";
        if (!v.sourceId) e.sourceId = "Source is required";
        if (!v.amount || v.amount <= 0) e.amount = "Amount must be greater than 0";
        return e;
      }}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Project" required error={errors.projectId}>
            <Select
              value={value.projectId ?? ""}
              onChange={(e) => setField("projectId", e.target.value)}
              invalid={!!errors.projectId}
            >
              <option value="">— Select project —</option>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
