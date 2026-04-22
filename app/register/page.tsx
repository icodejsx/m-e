"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, TrendingUp, AlertCircle } from "lucide-react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        departmentId: departmentId ? Number(departmentId) : undefined,
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-brand-600)] text-white shadow-sm">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-xs muted">
            Register as a reporting officer or administrator
          </p>
        </div>

        <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{error}</div>
              </div>
            ) : null}

            <Field label="Full name" required>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </Field>

            <Field label="Email" required>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field
              label="Password"
              required
              hint="Minimum 8 characters"
            >
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Field
              label="Department ID"
              hint="Numeric ID from the department registry (optional)"
            >
              <Input
                type="number"
                min={1}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                placeholder="e.g. 1"
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={submitting}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Create account
            </Button>

            <div className="pt-2 text-center text-xs muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[var(--color-brand-700)] hover:underline dark:text-[var(--color-brand-300)]"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
