"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const FIELD_BASE =
  "block w-full rounded-lg border bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors focus:outline-none focus:ring-brand focus:border-[var(--color-brand-500)] disabled:opacity-60 disabled:cursor-not-allowed";

type InputSize = "sm" | "md";
const SIZES: Record<InputSize, string> = {
  sm: "h-8 px-2.5",
  md: "h-10 px-3",
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", leftIcon, invalid, className, ...props },
  ref,
) {
  if (leftIcon) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)]">
          {leftIcon}
        </div>
        <input
          ref={ref}
          className={clsx(
            FIELD_BASE,
            SIZES[inputSize],
            "pl-9",
            invalid && "border-rose-400 focus:border-rose-500",
            className,
          )}
          {...props}
        />
      </div>
    );
  }
  return (
    <input
      ref={ref}
      className={clsx(
        FIELD_BASE,
        SIZES[inputSize],
        invalid && "border-rose-400 focus:border-rose-500",
        className,
      )}
      {...props}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  inputSize?: InputSize;
  invalid?: boolean;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { inputSize = "md", invalid, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={clsx(
        FIELD_BASE,
        SIZES[inputSize],
        "pr-8 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23667085%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:14px] bg-no-repeat bg-[right_0.75rem_center]",
        invalid && "border-rose-400 focus:border-rose-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(
        FIELD_BASE,
        "py-2 px-3 min-h-[80px]",
        invalid && "border-rose-400 focus:border-rose-500",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label ? (
        <label className="text-xs font-medium text-[var(--foreground)]/80">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <div className="text-xs text-rose-600">{error}</div>
      ) : hint ? (
        <div className="text-xs muted">{hint}</div>
      ) : null}
    </div>
  );
}
