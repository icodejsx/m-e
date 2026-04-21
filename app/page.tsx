"use client";

import Link from "next/link";
import {
  Building2,
  FileText,
  Briefcase,
  Target as TargetIcon,
  TrendingUp,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useStore, useActiveContext } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { formatCurrency, formatDate, sum, relativeFromNow } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const { state } = useStore();
  const { activePeriod } = useActiveContext();

  const reportsInPeriod = activePeriod
    ? state.reports.filter((r) => r.periodId === activePeriod.id)
    : state.reports;

  const statusCount = (s: string) =>
    reportsInPeriod.filter((r) => r.status === s).length;

  const totalBudget = sum(state.projects, (p) => p.budget ?? 0);
  const totalFunding = sum(state.projectFundings, (f) => f.amount);

  const targetRows = state.targets.map((t) => {
    const progress = state.targetProgress
      .filter((p) => p.targetId === t.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    const achieved = progress.length ? progress[progress.length - 1].value : t.baseline;
    const pct = t.target > 0 ? (achieved / t.target) * 100 : 0;
    return { target: t, achieved, pct };
  });

  const mdaReportMap = new Map<string, number>();
  reportsInPeriod.forEach((r) => {
    mdaReportMap.set(r.mdaId, (mdaReportMap.get(r.mdaId) ?? 0) + 1);
  });
  const mdaList = state.mdas
    .map((m) => ({
      mda: m,
      reports: mdaReportMap.get(m.id) ?? 0,
      projects: state.projects.filter((p) => p.mdaId === m.id).length,
      targets: state.targets.filter((t) => t.mdaId === m.id).length,
    }))
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 6);

  const recent = [...state.reports]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        icon={<TrendingUp className="h-5 w-5" />}
        title="Welcome to the M&E Platform"
        subtitle={
          activePeriod
            ? `Active reporting period: ${activePeriod.name}`
            : "Select a reporting period to filter activity."
        }
        actions={
          <>
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-700)]"
            >
              Capture report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
            >
              Update target progress
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="MDAs"
          value={state.mdas.length}
          icon={<Building2 className="h-4 w-4" />}
          tone="brand"
          hint={`${state.departments.length} departments`}
        />
        <Stat
          label="Projects"
          value={state.projects.length}
          icon={<Briefcase className="h-4 w-4" />}
          tone="violet"
          hint={`${formatCurrency(totalBudget)} budget · ${formatCurrency(totalFunding)} funded`}
        />
        <Stat
          label="Reports (this period)"
          value={reportsInPeriod.length}
          icon={<FileText className="h-4 w-4" />}
          tone="sky"
          hint={`${statusCount("submitted")} submitted · ${statusCount("approved")} approved`}
        />
        <Stat
          label="Targets"
          value={state.targets.length}
          icon={<TargetIcon className="h-4 w-4" />}
          tone="emerald"
          hint={`${state.targetProgress.length} progress entries`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Target progress"
            subtitle="Latest achievement vs target across programmes"
            actions={
              <Link
                href="/targets"
                className="text-xs font-medium text-[var(--color-brand-700)] hover:underline dark:text-[var(--color-brand-300)]"
              >
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {targetRows.length === 0 ? (
              <EmptyState
                title="No targets yet"
                message="Create targets to see progress against programme goals."
                className="m-4"
              />
            ) : (
              <div className="divide-y">
                {targetRows.slice(0, 6).map(({ target, achieved, pct }) => {
                  const unit = state.units.find((u) => u.id === target.unitId);
                  const mda = state.mdas.find((m) => m.id === target.mdaId);
                  const tone =
                    pct >= 90 ? "emerald" : pct >= 50 ? "brand" : pct >= 25 ? "amber" : "rose";
                  return (
                    <div
                      key={target.id}
                      className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-sm">
                            {target.name}
                          </span>
                          <Badge tone="neutral">
                            {mda?.code ?? mda?.name ?? "—"}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-xs muted">
                          {achieved.toLocaleString()} / {target.target.toLocaleString()}{" "}
                          {unit?.symbol ?? ""}
                        </div>
                      </div>
                      <div className="w-full md:w-64">
                        <ProgressBar value={pct} tone={tone} showLabel />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Reporting period"
            subtitle={
              activePeriod
                ? `${formatDate(activePeriod.startDate)} → ${formatDate(activePeriod.endDate)}`
                : "Select a period"
            }
            actions={
              <Link
                href="/reporting-periods"
                className="text-xs font-medium text-[var(--color-brand-700)] hover:underline dark:text-[var(--color-brand-300)]"
              >
                Manage
              </Link>
            }
          />
          <CardBody>
            {activePeriod ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-[var(--muted)]" />
                  <span className="text-sm">{activePeriod.name}</span>
                  <Badge
                    tone={
                      activePeriod.status === "open"
                        ? "success"
                        : activePeriod.status === "closed"
                          ? "neutral"
                          : "warning"
                    }
                    dot
                  >
                    {activePeriod.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniKpi
                    icon={<FileText className="h-4 w-4" />}
                    label="Submitted"
                    value={statusCount("submitted")}
                  />
                  <MiniKpi
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="Approved"
                    value={statusCount("approved")}
                  />
                  <MiniKpi
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Draft"
                    value={statusCount("draft")}
                  />
                </div>
              </div>
            ) : (
              <EmptyState title="No active period" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent reports"
            subtitle="Latest activity across MDAs"
            actions={
              <Link
                href="/reports"
                className="text-xs font-medium text-[var(--color-brand-700)] hover:underline dark:text-[var(--color-brand-300)]"
              >
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {recent.length === 0 ? (
              <EmptyState title="No reports yet" className="m-4" />
            ) : (
              <ul className="divide-y">
                {recent.map((r) => {
                  const mda = state.mdas.find((m) => m.id === r.mdaId);
                  const type = state.reportTypes.find((t) => t.id === r.typeId);
                  return (
                    <li key={r.id} className="px-4 py-3 md:px-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {r.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs muted">
                            <span>{mda?.name ?? "—"}</span>
                            <span>•</span>
                            <span>{type?.name ?? "—"}</span>
                            <span>•</span>
                            <span>{relativeFromNow(r.updatedAt)}</span>
                          </div>
                        </div>
                        <Badge
                          tone={
                            r.status === "approved"
                              ? "success"
                              : r.status === "submitted"
                                ? "info"
                                : r.status === "rejected"
                                  ? "danger"
                                  : "warning"
                          }
                          dot
                        >
                          {r.status}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="MDA activity"
            subtitle="Reports submitted this period"
          />
          <CardBody className="p-0">
            {mdaList.length === 0 ? (
              <EmptyState title="No MDAs yet" className="m-4" />
            ) : (
              <ul className="divide-y">
                {mdaList.map(({ mda, reports, projects, targets }) => (
                  <li
                    key={mda.id}
                    className="flex items-center gap-3 px-4 py-3 md:px-5"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-brand-50)] text-xs font-semibold text-[var(--color-brand-700)] dark:bg-[var(--color-brand-500)]/10 dark:text-[var(--color-brand-300)]">
                      {mda.code?.slice(0, 3) ?? mda.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {mda.name}
                      </div>
                      <div className="text-xs muted">
                        {projects} projects · {targets} targets
                      </div>
                    </div>
                    <Badge tone="brand">{reports} reports</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-center gap-1 text-[var(--muted)]">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
