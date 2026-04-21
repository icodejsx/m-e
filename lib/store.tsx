"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppState, CollectionKey, ID } from "./types";
import { buildSeed } from "./seed";
import { nowISO, uid } from "./utils";

const STORAGE_KEY = "me-platform/v1";

type WithId = { id: ID; createdAt?: string; updatedAt?: string };

function emptyState(): AppState {
  return {
    mdas: [],
    departments: [],
    reportClasses: [],
    reportCategories: [],
    reportTypes: [],
    lgas: [],
    units: [],
    reportingPeriods: [],
    fundingSources: [],
    reports: [],
    projects: [],
    projectFundings: [],
    targets: [],
    targetProgress: [],
    templates: [],
    users: [],
    assignments: [],
    activePeriodId: null,
    activeUserId: null,
  };
}

interface StoreContextValue {
  state: AppState;
  ready: boolean;
  setActivePeriod: (id: ID | null) => void;
  setActiveUser: (id: ID | null) => void;
  add: <K extends CollectionKey>(key: K, item: unknown) => { id: ID; createdAt: string; updatedAt: string };
  update: <K extends CollectionKey>(
    key: K,
    id: ID,
    patch: Record<string, unknown>,
  ) => void;
  remove: <K extends CollectionKey>(key: K, id: ID) => void;
  bulkRemove: <K extends CollectionKey>(key: K, ids: ID[]) => void;
  replace: (next: AppState) => void;
  resetDemoData: () => void;
  exportJSON: () => string;
  importJSON: (raw: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    const seed = buildSeed();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {}
    return seed;
  }
}

function persist(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => emptyState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) persist(state);
  }, [state, ready]);

  const add = useCallback(
    <K extends CollectionKey>(key: K, item: unknown) => {
      const now = nowISO();
      const record = {
        id: uid(),
        createdAt: now,
        updatedAt: now,
        ...(item as object),
      } as { id: ID; createdAt: string; updatedAt: string };
      setState((prev) => {
        const list = prev[key] as unknown as WithId[];
        return { ...prev, [key]: [record, ...list] } as AppState;
      });
      return record;
    },
    [],
  );

  const update = useCallback(
    <K extends CollectionKey>(
      key: K,
      id: ID,
      patch: Record<string, unknown>,
    ) => {
      setState((prev) => {
        const list = prev[key] as unknown as WithId[];
        const next = list.map((r) =>
          r.id === id
            ? ({ ...r, ...patch, updatedAt: nowISO() } as WithId)
            : r,
        );
        return { ...prev, [key]: next } as AppState;
      });
    },
    [],
  );

  const remove = useCallback(<K extends CollectionKey>(key: K, id: ID) => {
    setState((prev) => {
      const list = prev[key] as unknown as WithId[];
      return { ...prev, [key]: list.filter((r) => r.id !== id) } as AppState;
    });
  }, []);

  const bulkRemove = useCallback(
    <K extends CollectionKey>(key: K, ids: ID[]) => {
      const set = new Set(ids);
      setState((prev) => {
        const list = prev[key] as unknown as WithId[];
        return {
          ...prev,
          [key]: list.filter((r) => !set.has(r.id)),
        } as AppState;
      });
    },
    [],
  );

  const replace = useCallback((next: AppState) => {
    setState(next);
  }, []);

  const resetDemoData = useCallback(() => {
    const seed = buildSeed();
    setState(seed);
  }, []);

  const setActivePeriod = useCallback((id: ID | null) => {
    setState((prev) => ({ ...prev, activePeriodId: id }));
  }, []);

  const setActiveUser = useCallback((id: ID | null) => {
    setState((prev) => ({ ...prev, activeUserId: id }));
  }, []);

  const exportJSON = useCallback(() => JSON.stringify(state, null, 2), [state]);
  const importJSON = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw) as AppState;
      if (!parsed || typeof parsed !== "object" || !("mdas" in parsed))
        return false;
      setState(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      ready,
      setActivePeriod,
      setActiveUser,
      add,
      update,
      remove,
      bulkRemove,
      replace,
      resetDemoData,
      exportJSON,
      importJSON,
    }),
    [
      state,
      ready,
      setActivePeriod,
      setActiveUser,
      add,
      update,
      remove,
      bulkRemove,
      replace,
      resetDemoData,
      exportJSON,
      importJSON,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      {ready ? (
        children
      ) : (
        <div
          aria-hidden
          className="flex min-h-screen items-center justify-center bg-[var(--background)]"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
            <div className="text-xs muted">Loading workspace…</div>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useCollection<K extends CollectionKey>(key: K) {
  const { state } = useStore();
  return state[key];
}

export function useActiveContext() {
  const { state } = useStore();
  const activePeriod =
    state.reportingPeriods.find((p) => p.id === state.activePeriodId) ?? null;
  const activeUser = state.users.find((u) => u.id === state.activeUserId) ?? null;
  return { activePeriod, activeUser };
}
