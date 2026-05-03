import type { AppState } from "./types";
import { sum } from "./utils";

/** Compact, model-friendly view of programme data (built client-side from store). */
export interface AnalyticsSnapshot {
  generatedAt: string;
  activeReportingPeriod: { id: string; name: string } | null;
  counts: {
    mdas: number;
    departments: number;
    projects: number;
    reportsTotal: number;
    reportsInActivePeriod: number;
    targets: number;
    fundingSources: number;
    projectFundingEntries: number;
    users: number;
  };
  financials: {
    note: string;
    totalProjectBudget: number;
    totalRecordedFunding: number;
    fundingGapVsBudget: number;
  };
  reportsByStatus: Record<string, number>;
  projectsByStatus: Record<string, number>;
  topMdasByReports: {
    name: string;
    code: string;
    reportsInPeriod: number;
    projects: number;
    targets: number;
  }[];
  fundingBySource: { sourceName: string; kind: string; amount: number }[];
  projectsByFunding: {
    name: string;
    code?: string;
    status: string;
    budget: number;
    fundedTotal: number;
    pctBudgetFunded: number | null;
    mdaName: string;
  }[];
  targetsProgress: {
    name: string;
    mdaName: string;
    baseline: number;
    target: number;
    latestValue: number;
    pctTowardTarget: number;
  }[];
}

function topSorted<T>(arr: T[], pick: (t: T) => number, limit: number): T[] {
  return [...arr].sort((a, b) => pick(b) - pick(a)).slice(0, limit);
}

export function buildAnalyticsSnapshot(
  state: AppState,
  activePeriodId: string | null,
): AnalyticsSnapshot {
  const activePeriod = activePeriodId
    ? state.reportingPeriods.find((p) => p.id === activePeriodId) ?? null
    : null;

  const reportsInPeriod = activePeriod
    ? state.reports.filter((r) => r.periodId === activePeriod.id)
    : state.reports;

  const reportsByStatus: Record<string, number> = {};
  for (const r of reportsInPeriod) {
    reportsByStatus[r.status] = (reportsByStatus[r.status] ?? 0) + 1;
  }

  const projectsByStatus: Record<string, number> = {};
  for (const p of state.projects) {
    projectsByStatus[p.status] = (projectsByStatus[p.status] ?? 0) + 1;
  }

  const totalBudget = sum(state.projects, (p) => p.budget ?? 0);
  const totalFunding = sum(state.projectFundings, (f) => f.amount);

  const fundingByProject = new Map<string, number>();
  for (const f of state.projectFundings) {
    fundingByProject.set(f.projectId, (fundingByProject.get(f.projectId) ?? 0) + f.amount);
  }

  const fundingBySourceMap = new Map<string, { kind: string; amount: number }>();
  for (const f of state.projectFundings) {
    const src = state.fundingSources.find((s) => s.id === f.sourceId);
    const label = src?.name ?? "Unknown source";
    const prev = fundingBySourceMap.get(label);
    if (prev) prev.amount += f.amount;
    else fundingBySourceMap.set(label, { kind: src?.kind ?? "other", amount: f.amount });
  }
  const fundingBySource = topSorted(
    [...fundingBySourceMap.entries()].map(([sourceName, v]) => ({
      sourceName,
      kind: v.kind,
      amount: v.amount,
    })),
    (x) => x.amount,
    12,
  );

  const mdaReports = new Map<string, number>();
  for (const r of reportsInPeriod) {
    mdaReports.set(r.mdaId, (mdaReports.get(r.mdaId) ?? 0) + 1);
  }

  const topMdas = topSorted(
    state.mdas.map((m) => ({
      name: m.name,
      code: m.code,
      reportsInPeriod: mdaReports.get(m.id) ?? 0,
      projects: state.projects.filter((p) => p.mdaId === m.id).length,
      targets: state.targets.filter((t) => t.mdaId === m.id).length,
    })),
    (x) => x.reportsInPeriod,
    8,
  );

  const projectsByFunding = topSorted(
    state.projects.map((p) => {
      const funded = fundingByProject.get(p.id) ?? 0;
      const budget = p.budget ?? 0;
      const pct =
        budget > 0 ? Math.min(100, Math.round((funded / budget) * 1000) / 10) : null;
      const mda = state.mdas.find((m) => m.id === p.mdaId);
      return {
        name: p.name,
        code: p.code,
        status: p.status,
        budget,
        fundedTotal: funded,
        pctBudgetFunded: pct,
        mdaName: mda?.name ?? "—",
      };
    }),
    (x) => x.fundedTotal,
    15,
  );

  const targetsProgress = topSorted(
    state.targets.map((t) => {
      const progress = state.targetProgress
        .filter((p) => p.targetId === t.id)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      const latest =
        progress.length > 0 ? progress[progress.length - 1].value : t.baseline;
      const pct = t.target > 0 ? Math.round((latest / t.target) * 1000) / 10 : 0;
      const mda = state.mdas.find((m) => m.id === t.mdaId);
      return {
        name: t.name,
        mdaName: mda?.name ?? "—",
        baseline: t.baseline,
        target: t.target,
        latestValue: latest,
        pctTowardTarget: pct,
      };
    }),
    (x) => x.pctTowardTarget,
    15,
  );

  return {
    generatedAt: new Date().toISOString(),
    activeReportingPeriod: activePeriod
      ? { id: activePeriod.id, name: activePeriod.name }
      : null,
    counts: {
      mdas: state.mdas.length,
      departments: state.departments.length,
      projects: state.projects.length,
      reportsTotal: state.reports.length,
      reportsInActivePeriod: reportsInPeriod.length,
      targets: state.targets.length,
      fundingSources: state.fundingSources.length,
      projectFundingEntries: state.projectFundings.length,
      users: state.users.length,
    },
    financials: {
      note: "Budget is summed from project records; funding sums project funding allocations.",
      totalProjectBudget: totalBudget,
      totalRecordedFunding: totalFunding,
      fundingGapVsBudget: totalBudget - totalFunding,
    },
    reportsByStatus,
    projectsByStatus,
    topMdasByReports: topMdas,
    fundingBySource,
    projectsByFunding,
    targetsProgress,
  };
}
