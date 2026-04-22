"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Moon,
  Sun,
  Menu,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { findNavLink } from "@/lib/navigation";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { user, session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const match = findNavLink(pathname || "/");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name || session?.email || "Account";
  const displayEmail = user?.email || session?.email || "";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-[var(--surface)]/90 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
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

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs hover:bg-[var(--surface-2)]"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-brand-600)] text-[11px] font-semibold text-white">
              {initial}
            </span>
            <span className="hidden max-w-[140px] truncate font-medium sm:inline">
              {displayName}
            </span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border bg-[var(--surface)] shadow-lg"
            >
              <div className="border-b px-3 py-3">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-6 w-6 text-[var(--muted)]" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {displayName}
                    </div>
                    <div className="truncate text-[11px] muted">
                      {displayEmail}
                    </div>
                  </div>
                </div>
                {user?.departmentId ? (
                  <div className="mt-2 text-[11px] muted">
                    Department · #{user.departmentId}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-[var(--surface-2)]"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
