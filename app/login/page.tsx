"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, TrendingUp, AlertCircle } from "lucide-react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      const next = search.get("next") || "/";
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      ) : null}

      <Field label="Email" required>
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" required>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={submitting}
        leftIcon={<LogIn className="h-4 w-4" />}
      >
        Sign in
      </Button>

      <div className="pt-2 text-center text-xs muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-[var(--color-brand-700)] hover:underline dark:text-[var(--color-brand-300)]"
        >
          Create one
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-brand-600)] text-white shadow-sm">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">M&amp;E Platform</h1>
          <p className="mt-1 text-xs muted">
            Sign in to access monitoring &amp; evaluation workspace
          </p>
        </div>

        <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">
          <Suspense fallback={<div className="text-sm muted">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-[11px] muted">
          Connecting to{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px]">
            app-service.icadpays.com
          </code>
        </p>
      </div>
    </div>
  );
}
