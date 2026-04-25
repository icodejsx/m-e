"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { X } from "lucide-react";
import clsx from "clsx";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalDescriptor {
  id: string;
  title: string;
  subtitle?: string;
  size?: ModalSize;
  body: React.ReactNode;
  onClose?: () => void;
}
// ss
interface ModalContextValue {
  open: (m: Omit<ModalDescriptor, "id">) => string;
  close: (id?: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

const ModalContext = createContext<ModalContextValue | null>(null);

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ModalDescriptor[]>([]);

  const close = useCallback((id?: string) => {
    setStack((prev) => {
      if (!id) return prev.slice(0, -1);
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const open = useCallback((m: Omit<ModalDescriptor, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setStack((prev) => [...prev, { id, ...m }]);
    return id;
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).slice(2);
        setStack((prev) => [
          ...prev,
          {
            id,
            title: opts.title,
            size: "sm",
            body: (
              <ConfirmBody
                message={opts.message}
                confirmLabel={opts.confirmLabel ?? "Confirm"}
                cancelLabel={opts.cancelLabel ?? "Cancel"}
                tone={opts.tone ?? "default"}
                onResolve={(ok) => {
                  setStack((prev) => prev.filter((m) => m.id !== id));
                  resolve(ok);
                }}
              />
            ),
            onClose: () => resolve(false),
          },
        ]);
      });
    },
    [],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && stack.length) {
        const top = stack[stack.length - 1];
        top.onClose?.();
        close(top.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stack, close]);

  const value = useMemo(() => ({ open, close, confirm }), [open, close, confirm]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {stack.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 anim-fade">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              const top = stack[stack.length - 1];
              top.onClose?.();
              close(top.id);
            }}
          />
          {stack.map((m, i) => (
            <div
              key={m.id}
              className={clsx(
                "relative w-full anim-slide rounded-2xl bg-[var(--surface)] shadow-lg border",
                SIZE_CLASS[m.size ?? "md"],
                i !== stack.length - 1 && "hidden",
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`modal-title-${m.id}`}
            >
              <div className="flex items-start gap-4 border-b p-5">
                <div className="min-w-0 flex-1">
                  <div
                    id={`modal-title-${m.id}`}
                    className="text-base font-semibold text-[var(--foreground)]"
                  >
                    {m.title}
                  </div>
                  {m.subtitle ? (
                    <div className="mt-0.5 text-xs muted">{m.subtitle}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="-m-2 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                  aria-label="Close"
                  onClick={() => {
                    m.onClose?.();
                    close(m.id);
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[min(75vh,700px)] overflow-y-auto p-5">
                {m.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalContext.Provider>
  );
}

function ConfirmBody({
  message,
  confirmLabel,
  cancelLabel,
  tone,
  onResolve,
}: {
  message?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  tone: "default" | "danger";
  onResolve: (ok: boolean) => void;
}) {
  return (
    <div>
      {message ? (
        <div className="text-sm text-[var(--foreground)]/90">{message}</div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onResolve(false)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--surface-2)]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => onResolve(true)}
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-medium text-white",
            tone === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)]",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be inside ModalProvider");
  return ctx;
}
