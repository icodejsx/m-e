"use client";

import { useMemo, useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowActions } from "@/components/ui/RowActions";
import { Toolbar } from "@/components/ui/Toolbar";
import { useStore } from "@/lib/store";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import type { TargetProgress as TP } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ProgressPage() {
  const { state, add, update, remove } = useStore();
  const modal = useModal();
  const toast = useToast();
  const [mdaFilter, setMdaFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>(
    state.activePeriodId ?? "",
  );
  const [query, setQuery] = useState("");

  const targets = useMemo(() => {
    let list = state.targets;
    if (mdaFilter) list = list.filter((t) => t.mdaId === mdaFilter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [state.targets, mdaFilter, query]);

  function entriesFor(targetId: string): TP[] {
    const list = state.targetProgress.filter((p) => p.targetId === targetId);
    const filtered = periodFilter
      ? list.filter((p) => p.periodId === periodFilter)
      : list;
    return filtered.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  function latestValue(targetId: string, baseline: number): number {
    const all = state.targetProgress
      .filter((p) => p.targetId === targetId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    return all.length ? all[all.length - 1].value : baseline;
  }

  function openEntry(targetId: string, existing?: TP) {
    modal.open({
      title: existing ? "Update progress entry" : "Record progress",
      size: "md",
      body: (
        <ProgressForm
          targetId={targetId}
          initial={existing}
          onCancel={() => modal.close()}
          onSave={(v) => {
            if (existing) {
              update("targetProgress", existing.id, v);
              toast.success("Progress updated");
            } else {
              add("targetProgress", {
                targetId,
                ...v,
              } as never);
              toast.success("Progress recorded");
            }
            modal.close();
          }}
        />
      ),
    });
  }

  async function deleteEntry(p: TP) {
    const ok = await modal.confirm({
      title: "Delete progress entry?",
      message: "This action cannot be undone.",
      tone: "danger",
    });
    if (!ok) return;
    remove("targetProgress", p.id);
    toast.success("Entry deleted");
  }

  return (
    <div>
      <PageHeader
        icon={<TrendingUp className="h-5 w-5" />}
        title="Target Progress"
        subtitle="Record achievement against each target per reporting period."
      />

      <Toolbar
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search targets…"
        filters={
          <>
            <Select
              inputSize="sm"
              value={mdaFilter}
              onChange={(e) => setMdaFilter(e.target.value)}
            >
              <option value="">All MDAs</option>
              {state.mdas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Select
              inputSize="sm"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="">All periods</option>
              {state.reportingPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {targets.length === 0 ? (
        <EmptyState
          title="No targets match"
          message="Create targets or adjust the filters to see progress entries."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {targets.map((t) => {
            const unit = state.units.find((u) => u.id === t.unitId);
            const entries = entriesFor(t.id);
            const cur = latestValue(t.id, t.baseline);
            const pct = t.target ? (cur / t.target) * 100 : 0;
            const tone = pct >= 90 ? "emerald" : pct >= 50 ? "brand" : pct >= 25 ? "amber" : "rose";
            const mda = state.mdas.find((m) => m.id === t.mdaId);
            const proj = state.projects.find((p) => p.id === t.projectId);
            return (
              <Card key={t.id}>
                <CardHeader
                  title={
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{t.name}</span>
                      {mda ? <Badge tone="brand">{mda.code}</Badge> : null}
                      {proj ? (
                        <span className="text-xs muted">{proj.name}</span>
                      ) : null}
                    </div>
                  }
                  subtitle={`Baseline ${t.baseline.toLocaleString()} · Target ${t.target.toLocaleString()} ${unit?.symbol ?? ""}`}
                  actions={
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => openEntry(t.id)}
                    >
                      Add entry
                    </Button>
                  }
                />
                <CardBody className="p-0">
                  <div className="px-4 py-4 md:px-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="muted">
                        Achieved: {cur.toLocaleString()} {unit?.symbol ?? ""}
                      </span>
                      <span className="muted tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={pct} tone={tone} size="lg" />
                    </div>
                  </div>
                  {entries.length === 0 ? (
                    <div className="border-t p-4 text-center text-xs muted md:p-5">
                      No progress entries for the selected filters.
                    </div>
                  ) : (
                    <ul className="divide-y border-t">
                      {entries.map((e) => {
                        const period = state.reportingPeriods.find(
                          (p) => p.id === e.periodId,
                        );
                        const user = state.users.find(
                          (u) => u.id === e.reportedBy,
                        );
                        return (
                          <li
                            key={e.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-semibold tabular-nums">
                                  {e.value.toLocaleString()} {unit?.symbol ?? ""}
                                </span>
                                {period ? <Badge tone="neutral">{period.name}</Badge> : null}
                                <span className="text-xs muted">
                                  {formatDate(e.createdAt)}
                                </span>
                              </div>
                              {e.note ? (
                                <div className="mt-0.5 text-xs muted">{e.note}</div>
                              ) : null}
                              {user ? (
                                <div className="mt-0.5 text-[11px] muted">
                                  by {user.name}
                                </div>
                              ) : null}
                            </div>
                            <RowActions
                              onEdit={() => openEntry(t.id, e)}
                              onDelete={() => deleteEntry(e)}
                            />
                          </li>
                        );
                      })}
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
  targetId,
  initial,
  onCancel,
  onSave,
}: {
  targetId: string;
  initial?: TP;
  onCancel: () => void;
  onSave: (v: Omit<TP, "id" | "createdAt" | "updatedAt" | "targetId">) => void;
}) {
  const { state } = useStore();
  const [value, setValue] = useState<number>(initial?.value ?? 0);
  const [periodId, setPeriodId] = useState(
    initial?.periodId ?? state.activePeriodId ?? state.reportingPeriods[0]?.id ?? "",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const target = state.targets.find((t) => t.id === targetId);
  const unit = state.units.find((u) => u.id === target?.unitId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!periodId) errs.periodId = "Period is required";
    if (value === undefined || value === null || isNaN(Number(value)))
      errs.value = "Value is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave({
      value: Number(value),
      periodId,
      note: note.trim() || undefined,
      reportedBy: state.activeUserId ?? undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Period" required error={errors.periodId}>
        <Select
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          invalid={!!errors.periodId}
        >
          <option value="">— Select period —</option>
          {state.reportingPeriods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={`Achieved value${unit ? ` (${unit.symbol})` : ""}`}
        required
        error={errors.value}
      >
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          invalid={!!errors.value}
        />
      </Field>
      <Field label="Note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </Field>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save entry" : "Record progress"}</Button>
      </div>
    </form>
  );
}
