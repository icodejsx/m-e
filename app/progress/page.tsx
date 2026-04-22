"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, TrendingUp, RefreshCcw, Calculator, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/RowActions";
import { Toolbar } from "@/components/ui/Toolbar";
import { TargetProgressApi } from "@/lib/api/endpoints";
import { useTargets } from "@/lib/api/hooks";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import type {
  TargetDto,
  TargetProgressDto,
  UpsertTargetProgressDto,
} from "@/lib/api/types";

const STATUSES = ["InProgress", "OnTrack", "AtRisk", "Completed", "Computed"];

export default function ProgressPage() {
  const modal = useModal();
  const toast = useToast();
  const { session } = useAuth();
  const { data: targets } = useTargets();

  const [progressByTarget, setProgressByTarget] = useState<
    Record<number, TargetProgressDto[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("");

  const filteredTargets = useMemo(() => {
    let list = targets;
    if (targetFilter) list = list.filter((t) => t.id === Number(targetFilter));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((t) =>
        (t.targetName ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [targets, targetFilter, query]);

  const reload = useCallback(async () => {
    if (filteredTargets.length === 0) {
      setProgressByTarget({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        filteredTargets.map((t) =>
          TargetProgressApi.list({
            targetId: t.id,
            page: 1,
            pageSize: 100,
          }).then((r) => ({ id: t.id, items: r.items ?? [] })),
        ),
      );
      const map: Record<number, TargetProgressDto[]> = {};
      results.forEach((r) => {
        map[r.id] = r.items;
      });
      setProgressByTarget(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, [filteredTargets]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openEntry(target: TargetDto, existing?: TargetProgressDto) {
    modal.open({
      title: existing ? "Update progress entry" : "Record progress",
      size: "md",
      body: (
        <ProgressForm
          target={target}
          initial={existing ?? null}
          currentUserId={session?.userId}
          onCancel={() => modal.close()}
          onSave={async (v) => {
            try {
              await TargetProgressApi.upsert(v);
              toast.success(existing ? "Progress updated" : "Progress recorded");
              modal.close();
              await reload();
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
            }
          }}
        />
      ),
    });
  }

  async function deleteEntry(p: TargetProgressDto) {
    const ok = await modal.confirm({
      title: "Delete progress entry?",
      message: "This action cannot be undone.",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await TargetProgressApi.remove(p.id);
      toast.success("Entry deleted");
      await reload();
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  async function recalc(t: TargetDto) {
    if (!session) return;
    try {
      await TargetProgressApi.recalculate({
        targetId: t.id,
        userId: session.userId,
        reportingPeriodId: t.reportingPeriodId,
        lgaId: t.lgaId,
      });
      toast.success("Recalculated", "Progress aggregated from template data.");
      await reload();
    } catch (e) {
      toast.error(
        "Recalc failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  return (
    <div>
      <PageHeader
        icon={<TrendingUp className="h-5 w-5" />}
        title="Target Progress"
        subtitle="Record or recalculate progress against each target."
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCcw className="h-4 w-4" />}
            onClick={reload}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      <Toolbar
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search targets…"
        filters={
          <Select
            inputSize="sm"
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
          >
            <option value="">All targets</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.targetName} (#{t.id})
              </option>
            ))}
          </Select>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {filteredTargets.length === 0 ? (
        <EmptyState
          title={loading ? "Loading…" : "No targets match"}
          message="Create targets or adjust the filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTargets.map((t) => {
            const entries = progressByTarget[t.id] ?? [];
            const latest = entries[0];
            return (
              <Card key={t.id}>
                <CardHeader
                  title={
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{t.targetName ?? `Target #${t.id}`}</span>
                      <Badge tone="brand">#{t.id}</Badge>
                      {t.frequency ? (
                        <Badge tone="info">{t.frequency}</Badge>
                      ) : null}
                    </div>
                  }
                  subtitle={`Target value ${t.value.toLocaleString()} · Period #${t.reportingPeriodId} · LGA #${t.lgaId}`}
                  actions={
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Calculator className="h-3.5 w-3.5" />}
                        onClick={() => recalc(t)}
                      >
                        Recalculate
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                        onClick={() => openEntry(t)}
                      >
                        Add entry
                      </Button>
                    </div>
                  }
                />
                <CardBody className="p-0">
                  {latest ? (
                    <div className="border-b px-4 py-3 text-xs muted md:px-5">
                      Latest: <b>{latest.actualValue.toLocaleString()}</b> ·
                      status <Badge tone="info">{latest.status ?? "—"}</Badge>
                    </div>
                  ) : null}

                  {entries.length === 0 ? (
                    <div className="p-4 text-center text-xs muted md:p-5">
                      No progress entries yet.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {entries.map((e) => (
                        <li
                          key={e.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-semibold tabular-nums">
                                {e.actualValue.toLocaleString()}
                              </span>
                              <Badge tone="neutral">
                                Period #{e.reportingPeriodId}
                              </Badge>
                              <Badge tone="neutral">LGA #{e.lgaId}</Badge>
                              <Badge tone="info">{e.status ?? "—"}</Badge>
                              <span className="text-[11px] muted">
                                User #{e.userId}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEntry(t, e)}
                            >
                              Edit
                            </Button>
                            <IconButton
                              tone="danger"
                              title="Delete"
                              onClick={() => deleteEntry(e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressForm({
  target,
  initial,
  currentUserId,
  onCancel,
  onSave,
}: {
  target: TargetDto;
  initial: TargetProgressDto | null;
  currentUserId?: number;
  onCancel: () => void;
  onSave: (v: UpsertTargetProgressDto) => Promise<void>;
}) {
  const [actualValue, setActualValue] = useState<number>(
    initial?.actualValue ?? 0,
  );
  const [status, setStatus] = useState(initial?.status ?? "InProgress");
  const [reportingPeriodId, setReportingPeriodId] = useState(
    String(initial?.reportingPeriodId ?? target.reportingPeriodId ?? ""),
  );
  const [lgaId, setLgaId] = useState(
    String(initial?.lgaId ?? target.lgaId ?? ""),
  );
  const [userId, setUserId] = useState(
    String(initial?.userId ?? currentUserId ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!status) errs.status = "Status is required";
    if (!reportingPeriodId) errs.periodId = "Period is required";
    if (!lgaId) errs.lgaId = "LGA is required";
    if (!userId) errs.userId = "User is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        id: initial?.id,
        targetId: target.id,
        userId: Number(userId),
        reportingPeriodId: Number(reportingPeriodId),
        lgaId: Number(lgaId),
        actualValue: Number(actualValue) || 0,
        status,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Actual value">
        <Input
          type="number"
          step="any"
          value={actualValue}
          onChange={(e) => setActualValue(Number(e.target.value))}
        />
      </Field>
      <Field label="Status" required error={errors.status}>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          invalid={!!errors.status}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="User ID" required error={errors.userId}>
          <Input
            type="number"
            min={1}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            invalid={!!errors.userId}
          />
        </Field>
        <Field label="Period ID" required error={errors.periodId}>
          <Input
            type="number"
            min={1}
            value={reportingPeriodId}
            onChange={(e) => setReportingPeriodId(e.target.value)}
            invalid={!!errors.periodId}
          />
        </Field>
        <Field label="LGA ID" required error={errors.lgaId}>
          <Input
            type="number"
            min={1}
            value={lgaId}
            onChange={(e) => setLgaId(e.target.value)}
            invalid={!!errors.lgaId}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Save entry" : "Record progress"}
        </Button>
      </div>
    </form>
  );
}
