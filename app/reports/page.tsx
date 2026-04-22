"use client";

import { FileText } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ReportsApi } from "@/lib/api/endpoints";
import {
  useReportCategories,
  useReportTypes,
} from "@/lib/api/hooks";
import type { CreateReportDto, ReportDto } from "@/lib/api/types";

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually"];

export default function ReportsPage() {
  const { data: categories } = useReportCategories();
  const { data: types } = useReportTypes();

  return (
    <RemoteResourcePage<ReportDto, CreateReportDto>
      icon={<FileText className="h-5 w-5" />}
      title="Reports"
      subtitle="Reports defined for capture against report types and frequencies."
      singular="Report"
      modalSize="lg"
      fetchPage={({ page, pageSize }) =>
        ReportsApi.list({ page, pageSize })
      }
      create={(v) => ReportsApi.create(v)}
      update={(id, v) => ReportsApi.update(id, v)}
      remove={(id) => ReportsApi.remove(id)}
      toFormValue={(r) => ({
        reportName: r.reportName ?? "",
        departmentId: r.departmentId,
        reportCategoryId: r.reportCategoryId,
        reportTypeId: r.reportTypeId,
        frequency: r.frequency ?? "Monthly",
      })}
      defaultValue={() => ({
        reportName: "",
        frequency: "Monthly",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.reportName?.trim()) e.reportName = "Report name is required";
        if (!v.frequency) e.frequency = "Frequency is required";
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
          header: "Report",
          render: (r) => (
            <div className="font-medium">{r.reportName ?? "—"}</div>
          ),
          sortBy: (r) => r.reportName ?? "",
        },
        {
          key: "category",
          header: "Category",
          hidden: "md",
          render: (r) => (
            <span className="text-xs">
              {categories.find((c) => c.id === r.reportCategoryId)?.name ??
                `#${r.reportCategoryId}`}
            </span>
          ),
        },
        {
          key: "type",
          header: "Type",
          hidden: "md",
          render: (r) => (
            <span className="text-xs">
              {types.find((t) => t.id === r.reportTypeId)?.name ??
                `#${r.reportTypeId}`}
            </span>
          ),
        },
        {
          key: "department",
          header: "Department",
          hidden: "lg",
          render: (r) => (
            <Badge tone="brand">Dept #{r.departmentId}</Badge>
          ),
        },
        {
          key: "frequency",
          header: "Frequency",
          render: (r) => <Badge tone="info">{r.frequency ?? "—"}</Badge>,
          sortBy: (r) => r.frequency ?? "",
        },
      ]}
      renderForm={({ value, setField, errors }) => {
        const filteredTypes = value.reportCategoryId
          ? types.filter((t) => t.reportCategoryId === value.reportCategoryId)
          : types;

        return (
          <>
            <Field label="Report name" required error={errors.reportName}>
              <Input
                value={value.reportName ?? ""}
                onChange={(e) => setField("reportName", e.target.value)}
                placeholder="e.g. PHC Monthly Service Report"
                invalid={!!errors.reportName}
                maxLength={256}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Report category">
                <Select
                  value={value.reportCategoryId ?? ""}
                  onChange={(e) =>
                    setField(
                      "reportCategoryId",
                      Number(e.target.value) || undefined,
                    )
                  }
                >
                  <option value="">— Select —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (#{c.id})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Report type">
                <Select
                  value={value.reportTypeId ?? ""}
                  onChange={(e) =>
                    setField(
                      "reportTypeId",
                      Number(e.target.value) || undefined,
                    )
                  }
                >
                  <option value="">— Select —</option>
                  {filteredTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (#{t.id})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Department ID"
                hint="Numeric department identifier"
              >
                <Input
                  type="number"
                  min={1}
                  value={value.departmentId ?? ""}
                  onChange={(e) =>
                    setField(
                      "departmentId",
                      Number(e.target.value) || undefined,
                    )
                  }
                  placeholder="e.g. 1"
                />
              </Field>
              <Field label="Frequency" required error={errors.frequency}>
                <Select
                  value={value.frequency ?? ""}
                  onChange={(e) => setField("frequency", e.target.value)}
                  invalid={!!errors.frequency}
                >
                  <option value="">— Select —</option>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        );
      }}
    />
  );
}
