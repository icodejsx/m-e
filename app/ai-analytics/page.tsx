"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Landmark,
  Briefcase,
  ArrowRight,
  Download,
} from "lucide-react";
import { useStore, useActiveContext } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { buildAnalyticsSnapshot } from "@/lib/analyticsSnapshot";
import { downloadProfessionalAiTranscript } from "@/lib/pdf/aiTranscriptPdf";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ChatTurn = { role: "user" | "assistant"; content: string };

const MODEL_LABEL = "GPT-4o-mini";

function MiniBars({
  rows,
  valueKey,
  labelKey,
  format,
}: {
  rows: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  format: (n: number) => string;
}) {
  const max = Math.max(
    1,
    ...rows.map((r) => Number(r[valueKey]) || 0),
  );
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => {
        const label = String(row[labelKey] ?? "—");
        const value = Number(row[valueKey]) || 0;
        const pct = (value / max) * 100;
        return (
          <div key={`${label}-${i}`} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium text-[var(--foreground)]">
                {label}
              </span>
              <span className="shrink-0 tabular-nums muted">{format(value)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--color-brand-500)] transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AiAnalyticsPage() {
  const { state } = useStore();
  const { activePeriod } = useActiveContext();
  const { session, initializing: authInitializing } = useAuth();

  const snapshot = useMemo(
    () => buildAnalyticsSnapshot(state, state.activePeriodId),
    [state],
  );

  const fundingRows = snapshot.fundingBySource.map((r) => ({
    label: r.sourceName,
    value: r.amount,
  }));
  const statusRows = Object.entries(snapshot.reportsByStatus).map(
    ([label, value]) => ({ label, value }),
  );
  const projectStatusRows = Object.entries(snapshot.projectsByStatus).map(
    ([label, value]) => ({ label, value }),
  );

  const [input, setInput] = useState(
    "Give me an executive summary: programme health, funding vs budget, reporting in this period, and top risks.",
  );
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const q = input.trim();
    if (!q || pending || authInitializing || !session) return;
    setError(null);
    const prior = messages;
    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: q }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    try {
      const freshSnapshot = buildAnalyticsSnapshot(state, state.activePeriodId);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
        "x-me-user-id": String(session.userId),
      };
      const res = await fetch("/api/ai-analytics", {
        method: "POST",
        headers,
        body: JSON.stringify({
          snapshot: freshSnapshot,
          messages: nextMessages,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; detail?: string };
      if (!res.ok) {
        throw new Error(data.detail || data.error || `Request failed (${res.status})`);
      }
      if (!data.reply) throw new Error("No reply from assistant");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setMessages(prior);
    } finally {
      setPending(false);
    }
  }

  function clearAnalysis() {
    setMessages([]);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Sparkles className="h-5 w-5" />}
        title="AI analytics"
        subtitle={
          activePeriod ? (
            <>
              The assistant blends your{" "}
              <strong className="font-medium text-[var(--foreground)]">workspace snapshot</strong>{" "}
              with{" "}
              <strong className="font-medium text-[var(--foreground)]">
                live API data
              </strong>{" "}
              (same routes as the backend Swagger docs). Reporting period for charts:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {activePeriod.name}
              </span>
              .
            </>
          ) : (
            "Workspace charts include all periods. Signed-in sessions can query the live API via the assistant."
          )
        }
        actions={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Projects"
          value={snapshot.counts.projects}
          icon={<Briefcase className="h-4 w-4" />}
          tone="violet"
          hint={`${formatCurrency(snapshot.financials.totalProjectBudget)} budget`}
        />
        <Stat
          label="Recorded funding"
          value={formatCurrency(snapshot.financials.totalRecordedFunding)}
          icon={<Landmark className="h-4 w-4" />}
          tone="brand"
          hint={`Gap vs budget: ${formatCurrency(snapshot.financials.fundingGapVsBudget)}`}
        />
        <Stat
          label="Reports (filtered)"
          value={snapshot.counts.reportsInActivePeriod}
          tone="sky"
          hint={`${snapshot.counts.reportsTotal} total in system`}
        />
        <Stat
          label="Targets"
          value={snapshot.counts.targets}
          tone="emerald"
          hint={`${snapshot.counts.mdas} MDAs · ${snapshot.counts.users} users`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Funding by source" />
            <CardBody>
              {fundingRows.length ? (
                <MiniBars
                  rows={fundingRows.map((r) => ({ label: r.label, value: r.value }))}
                  valueKey="value"
                  labelKey="label"
                  format={(n) => formatCurrency(n)}
                />
              ) : (
                <p className="text-sm muted">No project funding rows yet.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Top projects by funding received" />
            <CardBody>
              {snapshot.projectsByFunding.length ? (
                <MiniBars
                  rows={snapshot.projectsByFunding.map((p) => ({
                    label: p.code ? `${p.name} (${p.code})` : p.name,
                    value: p.fundedTotal,
                  }))}
                  valueKey="value"
                  labelKey="label"
                  format={(n) => formatCurrency(n)}
                />
              ) : (
                <p className="text-sm muted">No allocations recorded.</p>
              )}
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader title="Reports by status" />
              <CardBody>
                {statusRows.length ? (
                  <MiniBars
                    rows={statusRows}
                    valueKey="value"
                    labelKey="label"
                    format={(n) => formatNumber(n)}
                  />
                ) : (
                  <p className="text-sm muted">No reports in this filter.</p>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Projects by status" />
              <CardBody>
                {projectStatusRows.length ? (
                  <MiniBars
                    rows={projectStatusRows}
                    valueKey="value"
                    labelKey="label"
                    format={(n) => formatNumber(n)}
                  />
                ) : (
                  <p className="text-sm muted">No projects.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        <Card className="flex min-h-[480px] flex-col xl:min-h-[640px]">
          <CardHeader
            title="AI session"
            subtitle="Ask about programmes, LGAs, funding, reports, and targets. Answers may combine your workspace snapshot with authenticated GET calls to the M&E API."
          />
          <CardBody className="flex flex-1 flex-col gap-3">
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3 text-sm">
              {messages.length === 0 ? (
                <p className="muted">
                  Run an analysis to see narrative insights here. Suggested: funding coverage,
                  reporting throughput by MDA, and targets at risk.
                </p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user"
                        ? "ml-8 rounded-lg bg-[var(--color-brand-600)]/15 px-3 py-2 text-[var(--foreground)]"
                        : "mr-4 whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] px-3 py-2"
                    }
                  >
                    {m.role === "assistant" ? (
                      <div className="[&_ul]:my-2 [&_li]:my-0.5">
                        {renderMarkdownish(m.content)}
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                ))
              )}
              {pending ? (
                <div className="flex items-center gap-2 muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                placeholder="Ask about funding, projects, reports, targets…"
                className="min-h-[100px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none ring-[var(--color-brand-500)] focus-visible:ring-2"
                disabled={pending || authInitializing || !session}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={
                      pending ||
                      !input.trim() ||
                      authInitializing ||
                      !session
                    }
                    className="inline-flex items-center gap-2 rounded-md bg-[#2CB5BE] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#259aa3] disabled:pointer-events-none disabled:opacity-40"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 shrink-0" />
                    )}
                    Run AI analysis
                  </button>

                  <button
                    type="button"
                    title="Download chat transcript as a .pdf file"
                    disabled={
                      messages.length === 0 ||
                      pending ||
                      authInitializing ||
                      !session
                    }
                    onClick={() =>
                      void downloadProfessionalAiTranscript(messages).catch(() =>
                        window.alert(
                          "Could not create the PDF. Check disk permissions or try again.",
                        ),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-md border border-[var(--foreground)]/20 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--surface-2)] disabled:pointer-events-none disabled:opacity-40 dark:border-[var(--foreground)]/25"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    Download PDF
                  </button>

                  <button
                    type="button"
                    disabled={pending || authInitializing || !session}
                    onClick={clearAnalysis}
                    className="inline-flex items-center gap-2 rounded-md border border-[var(--foreground)]/20 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--surface-2)] disabled:pointer-events-none disabled:opacity-40 dark:border-[var(--foreground)]/25"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Sparkles className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  <span className="font-medium tracking-tight text-[var(--foreground)]/70">
                    {MODEL_LABEL}
                  </span>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                <strong className="font-medium text-[var(--foreground)]/80">
                  PDF:
                </strong>{" "}
                A4 report layout with clear headings, lists, and page numbers.
                Markdown is cleaned automatically so the file reads like a formal
                document.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/** Minimal formatting for assistant replies (headings + bullets); avoids extra deps. */
function renderMarkdownish(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      const id = k++;
      blocks.push(
        <h3 key={id} className="mt-3 first:mt-0 text-base font-semibold">
          {line.slice(3)}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      const id = k++;
      blocks.push(
        <ul key={id} className="my-2 list-disc pl-5">
          {items.map((t, j) => (
            <li key={j}>{t}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const id = k++;
    blocks.push(
      <p key={id} className="my-1.5">
        {line}
      </p>,
    );
    i += 1;
  }
  return blocks;
}
