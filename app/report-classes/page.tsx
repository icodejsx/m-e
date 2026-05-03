"use client";

import { useCallback, useState } from "react";
import { FolderTree } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { ReportClassesApi } from "@/lib/api/endpoints";
import type {
  CreateReportClassDto,
  ReportClassDto,
} from "@/lib/api/types";

type NameFilter = "all" | "named" | "unnamed";

export default function ReportClassesPage() {
  const [nameFilter, setNameFilter] = useState<NameFilter>("all");

  const fetchPage = useCallback(
    async (_args: { page: number; pageSize: number; search: string }) =>
      ReportClassesApi.list(),
    [],
  );

  const filterRows = useCallback(
    (row: ReportClassDto & { id: string }) => {
      const n = row.name?.trim();
      if (nameFilter === "named") return !!n;
      if (nameFilter === "unnamed") return !n;
      return true;
    },
    [nameFilter],
  );

  return (
    <RemoteResourcePage<ReportClassDto, CreateReportClassDto>
      icon={<FolderTree className="h-5 w-5" />}
      title="Report Classes"
      subtitle="Top-level categories that group report categories and types."
      singular="Report class"
      fetchPage={fetchPage}
      filterRows={filterRows}
      hasActiveFilters={nameFilter !== "all"}
      filters={
        <Select
          inputSize="sm"
          className="min-w-[168px]"
          aria-label="Filter by name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value as NameFilter)}
        >
          <option value="all">All classes</option>
          <option value="named">Named only</option>
          <option value="unnamed">Unnamed only</option>
        </Select>
      }
      create={(v) => ReportClassesApi.create(v)}
      update={(id, v) => ReportClassesApi.update(id, v)}
      remove={(id) => ReportClassesApi.remove(id)}
      toFormValue={(r) => ({ name: r.name ?? "" })}
      defaultValue={() => ({ name: "" })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
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
      ]}
      renderForm={({ value, setField, errors }) => (
        <Field label="Name" required error={errors.name}>
          <Input
            value={value.name ?? ""}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Financial"
            invalid={!!errors.name}
            maxLength={256}
          />
        </Field>
      )}
    />
  );
}
