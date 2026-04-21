"use client";

import { FileType2 } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { ReportType } from "@/lib/types";

export default function ReportTypesPage() {
  const { state } = useStore();
  return (
    <ResourcePage<ReportType>
      collection="reportTypes"
      icon={<FileType2 className="h-5 w-5" />}
      title="Report Types"
      subtitle="Specific report templates assigned to reporting officers."
      singular="Report type"
      plural="Report types"
      searchKeys={["name", "description"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "category",
          header: "Category",
          sortBy: (r) => state.reportCategories.find((c) => c.id === r.categoryId)?.name,
          render: (r) => {
            const c = state.reportCategories.find((c) => c.id === r.categoryId);
            const cls = c ? state.reportClasses.find((x) => x.id === c.classId) : null;
            return c ? (
              <div className="flex flex-col">
                <span>{c.name}</span>
                {cls ? <span className="text-xs muted">{cls.name}</span> : null}
              </div>
            ) : (
              "—"
            );
          },
        },
        {
          key: "template",
          header: "Template",
          hidden: "md",
          render: (r) => {
            const t = state.templates.find((tmp) => tmp.id === r.templateId);
            return t ? <Badge tone="violet">{t.name}</Badge> : <span className="muted">—</span>;
          },
        },
      ]}
      defaultValue={() => ({
        name: "",
        categoryId: state.reportCategories[0]?.id,
        templateId: undefined,
        description: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.categoryId) e.categoryId = "Category is required";
        return e;
      }}
      canDelete={(r) =>
        state.reports.some((rep) => rep.typeId === r.id)
          ? "Remove related reports first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Category" required error={errors.categoryId}>
            <Select
              value={value.categoryId ?? ""}
              onChange={(e) => setField("categoryId", e.target.value)}
              invalid={!!errors.categoryId}
            >
              <option value="">— Select category —</option>
              {state.reportCategories.map((c) => (
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
          <Field
            label="Default template"
            hint="Optional template applied when capturing this report type."
          >
            <Select
              value={value.templateId ?? ""}
              onChange={(e) => setField("templateId", e.target.value || undefined)}
            >
              <option value="">— None —</option>
              {state.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
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
      )}
    />
  );
}
