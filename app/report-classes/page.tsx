"use client";

import { FolderTree } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import type { ReportClass } from "@/lib/types";

export default function ReportClassesPage() {
  const { state } = useStore();
  return (
    <ResourcePage<ReportClass>
      collection="reportClasses"
      icon={<FolderTree className="h-5 w-5" />}
      title="Report Classes"
      subtitle="Top-level classification for reports."
      singular="Report class"
      plural="Report classes"
      searchKeys={["name", "description"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "description",
          header: "Description",
          hidden: "md",
          render: (r) => <span className="muted">{r.description ?? "—"}</span>,
        },
        {
          key: "categories",
          header: "Categories",
          sortBy: (r) => state.reportCategories.filter((c) => c.classId === r.id).length,
          render: (r) => state.reportCategories.filter((c) => c.classId === r.id).length,
        },
      ]}
      defaultValue={() => ({ name: "", description: "" })}
      validate={(v) => ({
        ...(v.name?.trim() ? {} : { name: "Name is required" }),
      })}
      canDelete={(r) =>
        state.reportCategories.some((c) => c.classId === r.id)
          ? "Remove the dependent categories first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Financial"
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
