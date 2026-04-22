"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { PUBLIC_ROUTES, useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { session, initializing } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

  const isPublic = PUBLIC_ROUTES.has(pathname ?? "");

  if (isPublic) {
    return <>{children}</>;
  }

  if (initializing || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
          <div className="text-xs muted">
            {initializing ? "Loading session…" : "Redirecting…"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen">
        <Sidebar />
      </div>

      <div
        className={clsx(
          "fixed inset-0 z-40 lg:hidden transition-opacity",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={clsx(
            "absolute left-0 top-0 h-full w-[280px] transform shadow-xl transition-transform",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setMobileNavOpen(true)} />
        <section className="flex-1 px-4 py-4 md:px-6 md:py-6 anim-fade">
          {children}
        </section>
        <footer className="border-t px-4 py-3 text-[11px] muted md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} M&amp;E Platform</span>
            <span>Data is stored locally in your browser.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
