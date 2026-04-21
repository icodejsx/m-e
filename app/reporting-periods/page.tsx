"use client";

import { CalendarRange } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { ReportingPeriod } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReportingPeriodsPage() {
  const { state } = useStore();
  return (
    <ResourcePage<ReportingPeriod>
      collection="reportingPeriods"
      icon={<CalendarRange className="h-5 w-5" />}
      title="Reporting Periods"
      subtitle="Cycles during which data is collected and reports are submitted."
      singular="Period"
      plural="Periods"
      searchKeys={["name"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          key: "range",
          header: "Range",
          sortBy: (r) => r.startDate,
          render: (r) => (
            <span className="muted">
              {formatDate(r.startDate)} → {formatDate(r.endDate)}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          sortBy: (r) => r.status,
          render: (r) => (
            <Badge
              tone={
                r.status === "open"
                  ? "success"
                  : r.status === "closed"
                    ? "neutral"
                    : "warning"
              }
              dot
            >
              {r.status}
            </Badge>
          ),
        },
        {
          key: "reports",
          header: "Reports",
          hidden: "md",
          render: (r) => state.reports.filter((rep) => rep.periodId === r.id).length,
          sortBy: (r) => state.reports.filter((rep) => rep.periodId === r.id).length,
        },
      ]}
      defaultValue={() => ({
        name: "",
        startDate: "",
        endDate: "",
        status: "upcoming",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.startDate) e.startDate = "Start date is required";
        if (!v.endDate) e.endDate = "End date is required";
        if (v.startDate && v.endDate && v.startDate > v.endDate)
          e.endDate = "End date must be after start";
        return e;
      }}
      canDelete={(r) =>
        state.reports.some((rep) => rep.periodId === r.id)
          ? "Remove related reports first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <Field label="Name" required error={errors.name}>
            <Input
              value={value.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Q3 2025"
              invalid={!!errors.name}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start date" required error={errors.startDate}>
              <Input
                type="date"
                value={value.startDate ?? ""}
                onChange={(e) => setField("startDate", e.target.value)}
                invalid={!!errors.startDate}
              />
            </Field>
            <Field label="End date" required error={errors.endDate}>
              <Input
                type="date"
                value={value.endDate ?? ""}
                onChange={(e) => setField("endDate", e.target.value)}
                invalid={!!errors.endDate}
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={value.status ?? "upcoming"}
              onChange={(e) =>
                setField("status", e.target.value as ReportingPeriod["status"])
              }
            >
              <option value="upcoming">Upcoming</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </Select>
          </Field>
        </>
      )}
    />
  );
}
