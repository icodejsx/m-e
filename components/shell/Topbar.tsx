"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Moon,
  Sun,
  Menu,
  Download,
  Upload,
} from "lucide-react";
import { findNavLink } from "@/lib/navigation";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { download } from "@/lib/utils";
import { useRef } from "react";

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const pathname = usePathname();
  const { state, setActivePeriod, setActiveUser, exportJSON, importJSON } =
    useStore();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const match = findNavLink(pathname || "/");

  function handleExport() {
    download(
      `me-platform-export-${new Date().toISOString().slice(0, 10)}.json`,
      exportJSON(),
    );
    toast.success("Exported", "Data downloaded as JSON.");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJSON(String(reader.result ?? ""));
      if (ok) toast.success("Imported", "Dataset restored from file.");
      else toast.error("Import failed", "The file doesn't look like a valid export.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b bg-[var(--surface)]/90 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenNav}
          className="grid h-9 w-9 place-items-center rounded-lg border text-[var(--muted)] hover:bg-[var(--surface-2)] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="min-w-0 flex-1 flex flex-wrap items-center gap-1 text-sm"
        >
          <Link
            href="/"
            className="muted hover:text-[var(--foreground)] transition-colors"
          >
            Home
          </Link>
          {match ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span className="muted">{match.section.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span className="font-medium text-[var(--foreground)] truncate">
                {match.link.label}
              </span>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface-2)]"
            title="Import JSON"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface-2)]"
            title="Export JSON"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-lg border text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ContextPill label="Active period">
          <Select
            inputSize="sm"
            className="min-w-[160px]"
            value={state.activePeriodId ?? ""}
            onChange={(e) => setActivePeriod(e.target.value || null)}
          >
            <option value="">— None —</option>
            {state.reportingPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </ContextPill>

        <ContextPill label="Acting as">
          <Select
            inputSize="sm"
            className="min-w-[180px]"
            value={state.activeUserId ?? ""}
            onChange={(e) => setActiveUser(e.target.value || null)}
          >
            <option value="">— None —</option>
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {roleLabel(u.role)}
              </option>
            ))}
          </Select>
        </ContextPill>

        {state.activePeriodId ? (
          <Badge
            tone={
              state.reportingPeriods.find((p) => p.id === state.activePeriodId)
                ?.status === "open"
                ? "success"
                : "neutral"
            }
            dot
          >
            {
              state.reportingPeriods.find((p) => p.id === state.activePeriodId)
                ?.status
            }
          </Badge>
        ) : null}
      </div>
    </header>
  );
}

function ContextPill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-[var(--surface-2)] px-2.5 py-1">
      <span className="text-[11px] font-medium uppercase tracking-wide muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function roleLabel(r: string) {
  if (r === "admin") return "Admin";
  if (r === "reporting_officer") return "Reporting Officer";
  if (r === "viewer") return "Viewer";
  return r;
}
