"use client";

import { Tags } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { ReportCategory } from "@/lib/types";

export default function ReportCategoriesPage() {
  const { state } = useStore();
  return (
    <ResourcePage<ReportCategory>
      collection="reportCategories"
      icon={<Tags className="h-5 w-5" />}
      title="Report Categories"
      subtitle="Sub-groupings under each report class."
      singular="Report category"
      plural="Report categories"
      searchKeys={["name", "description"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "class",
          header: "Class",
          sortBy: (r) => state.reportClasses.find((c) => c.id === r.classId)?.name,
          render: (r) => {
            const rc = state.reportClasses.find((c) => c.id === r.classId);
            return rc ? <Badge tone="brand">{rc.name}</Badge> : "—";
          },
        },
        {
          key: "types",
          header: "Types",
          hidden: "md",
          sortBy: (r) => state.reportTypes.filter((t) => t.categoryId === r.id).length,
          render: (r) => state.reportTypes.filter((t) => t.categoryId === r.id).length,
        },
      ]}
      defaultValue={() => ({ name: "", classId: state.reportClasses[0]?.id, description: "" })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.classId) e.classId = "Class is required";
        return e;
      }}
      canDelete={(r) =>
        state.reportTypes.some((t) => t.categoryId === r.id)
          ? "Remove the dependent report types first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Report Class" required error={errors.classId}>
            <Select
              value={value.classId ?? ""}
              onChange={(e) => setField("classId", e.target.value)}
              invalid={!!errors.classId}
            >
              <option value="">— Select class —</option>
              {state.reportClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              invalid={!!errors.name}
            />
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
