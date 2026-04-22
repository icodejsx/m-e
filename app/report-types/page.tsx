"use client";

import { FileType2 } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { ReportTypesApi } from "@/lib/api/endpoints";
import { useReportCategories } from "@/lib/api/hooks";
import type {
  CreateReportTypeDto,
  ReportTypeDto,
} from "@/lib/api/types";

export default function ReportTypesPage() {
  const { data: categories } = useReportCategories();

  return (
    <RemoteResourcePage<ReportTypeDto, CreateReportTypeDto>
      icon={<FileType2 className="h-5 w-5" />}
      title="Report Types"
      subtitle="Each type belongs to a category and is used to create reports."
      singular="Report type"
      fetchPage={({ page, pageSize }) =>
        ReportTypesApi.list({ page, pageSize })
      }
      create={(v) => ReportTypesApi.create(v)}
      update={(id, v) => ReportTypesApi.update(id, v)}
      remove={(id) => ReportTypesApi.remove(id)}
      toFormValue={(r) => ({
        name: r.name ?? "",
        reportCategoryId: r.reportCategoryId,
      })}
      defaultValue={() => ({
        name: "",
        reportCategoryId: categories[0]?.id,
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.reportCategoryId)
          e.reportCategoryId = "Report category is required";
        return e;
      }}
      columns={[
        {
          key: "id",
          header: "ID",
          width: "80px",
          render: (r) => <span className="muted tabular-nums">#{r.id}</span>,
          sortBy: (r) => Number(r.id),
        },
        {
          key: "name",
          header: "Name",
          render: (r) => <span className="font-medium">{r.name}</span>,
          sortBy: (r) => r.name ?? "",
        },
        {
          key: "category",
          header: "Category",
          render: (r) =>
            categories.find((c) => c.id === r.reportCategoryId)?.name ??
            `#${r.reportCategoryId}`,
          sortBy: (r) => r.reportCategoryId,
        },
      ]}
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              invalid={!!errors.name}
              maxLength={256}
              placeholder="e.g. PHC Monthly Service"
            />
          </Field>
          <Field
            label="Report category"
            required
            error={errors.reportCategoryId}
          >
            <Select
              value={value.reportCategoryId ?? ""}
              onChange={(e) =>
                setField(
                  "reportCategoryId",
                  Number(e.target.value) || undefined,
                )
              }
              invalid={!!errors.reportCategoryId}
            >
              <option value="">— Select —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (#{c.id})
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
    />
  );
}
