"use client";

import { useCallback, useState } from "react";
import { Tags } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { ReportCategoriesApi } from "@/lib/api/endpoints";
import { useReportClasses } from "@/lib/api/hooks";
import type {
  CreateReportCategoryDto,
  ReportCategoryDto,
} from "@/lib/api/types";

export default function ReportCategoriesPage() {
  const { data: classes } = useReportClasses();
  const [classFilter, setClassFilter] = useState<number | "">("");

  const fetchPage = useCallback(
    ({
      page,
      pageSize,
    }: {
      page: number;
      pageSize: number;
      search: string;
    }) =>
      ReportCategoriesApi.list({
        page,
        pageSize,
        ...(classFilter !== "" ? { reportClassId: classFilter } : {}),
      }),
    [classFilter],
  );

  return (
    <RemoteResourcePage<ReportCategoryDto, CreateReportCategoryDto>
      icon={<Tags className="h-5 w-5" />}
      title="Report Categories"
      subtitle="Categories belong to a report class."
      singular="Report category"
      fetchPage={fetchPage}
      resetPageWhen={classFilter}
      hasActiveFilters={classFilter !== ""}
      filters={
        <Select
          inputSize="sm"
          className="min-w-[220px]"
          aria-label="Filter by report class"
          value={classFilter === "" ? "" : String(classFilter)}
          onChange={(e) => {
            const v = e.target.value;
            setClassFilter(v === "" ? "" : Number(v));
          }}
        >
          <option value="">All report classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? `Class #${c.id}`}
            </option>
          ))}
        </Select>
      }
      create={(v) => ReportCategoriesApi.create(v)}
      update={(id, v) => ReportCategoriesApi.update(id, v)}
      remove={(id) => ReportCategoriesApi.remove(id)}
      toFormValue={(r) => ({
        name: r.name ?? "",
        reportClassId: r.reportClassId,
      })}
      defaultValue={() => ({ name: "", reportClassId: classes[0]?.id })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.reportClassId) e.reportClassId = "Report class is required";
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
          key: "class",
          header: "Class",
          render: (r) =>
            classes.find((c) => c.id === r.reportClassId)?.name ??
            `#${r.reportClassId}`,
          sortBy: (r) => r.reportClassId,
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
              placeholder="e.g. Service Delivery"
            />
          </Field>
          <Field
            label="Report class"
            required
            error={errors.reportClassId}
          >
            <Select
              value={value.reportClassId ?? ""}
              onChange={(e) =>
                setField("reportClassId", Number(e.target.value) || undefined)
              }
              invalid={!!errors.reportClassId}
            >
              <option value="">— Select —</option>
              {classes.map((c) => (
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
