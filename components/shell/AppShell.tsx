"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

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
