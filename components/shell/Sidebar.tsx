"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { NAV } from "@/lib/navigation";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const initialOpen = useMemo(() => {
    const out: Record<string, boolean> = {};
    NAV.forEach((s) => (out[s.id] = true));
    return out;
  }, []);
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  const activePath = pathname || "/";

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r bg-[var(--surface)]">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">M&amp;E Platform</div>
          <div className="text-[11px] muted leading-tight">
            Monitoring &amp; Evaluation
          </div>
        </div>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => {
          const isOpen = open[section.id] ?? true;
          return (
            <div key={section.id} className="mb-3">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                onClick={() =>
                  setOpen((p) => ({ ...p, [section.id]: !isOpen }))
                }
                aria-expanded={isOpen}
              >
                <ChevronDown
                  className={clsx(
                    "h-3.5 w-3.5 transition-transform",
                    !isOpen && "-rotate-90",
                  )}
                />
                {section.label}
              </button>
              {isOpen ? (
                <div className="mt-1 flex flex-col gap-0.5">
                  {section.links.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      link.href === "/"
                        ? activePath === "/"
                        : activePath === link.href ||
                          activePath.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onNavigate}
                        className={clsx(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-500)]/10 dark:text-[var(--color-brand-300)]"
                            : "text-[var(--foreground)]/75 hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                        )}
                      >
                        {isActive ? (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--color-brand-500)]" />
                        ) : null}
                        <Icon
                          className={clsx(
                            "h-4 w-4 shrink-0",
                            isActive
                              ? "text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
                              : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                          )}
                        />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
