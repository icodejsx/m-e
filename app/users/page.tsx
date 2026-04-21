"use client";

import { Users as UsersIcon } from "lucide-react";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";

const ROLE_TONE = {
  admin: "brand",
  reporting_officer: "info",
  viewer: "neutral",
} as const;

export default function UsersPage() {
  const { state } = useStore();
  return (
    <ResourcePage<User>
      collection="users"
      icon={<UsersIcon className="h-5 w-5" />}
      title="Users (Reporting Officers)"
      subtitle="Administrators and reporting officers of the M&E platform."
      singular="User"
      plural="Users"
      searchKeys={["name", "email", "title"]}
      columns={[
        {
          key: "name",
          header: "Name",
          sortBy: (r) => r.name,
          render: (r) => (
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-brand-50)] text-xs font-semibold text-[var(--color-brand-700)] dark:bg-[var(--color-brand-500)]/10 dark:text-[var(--color-brand-300)]">
                {r.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                <div className="truncate text-xs muted">{r.email}</div>
              </div>
            </div>
          ),
        },
        {
          key: "role",
          header: "Role",
          sortBy: (r) => r.role,
          render: (r) => (
            <Badge tone={ROLE_TONE[r.role]}>
              {r.role === "reporting_officer" ? "Reporting officer" : r.role}
            </Badge>
          ),
        },
        {
          key: "mda",
          header: "MDA",
          hidden: "md",
          render: (r) => {
            const m = state.mdas.find((mda) => mda.id === r.mdaId);
            return m ? m.code : <span className="muted">—</span>;
          },
        },
        {
          key: "title",
          header: "Title",
          hidden: "lg",
          render: (r) => <span className="muted">{r.title ?? "—"}</span>,
        },
        {
          key: "active",
          header: "Status",
          sortBy: (r) => (r.active ? 1 : 0),
          render: (r) => (
            <Badge tone={r.active ? "success" : "neutral"} dot>
              {r.active ? "active" : "inactive"}
            </Badge>
          ),
        },
      ]}
      defaultValue={() => ({
        name: "",
        email: "",
        role: "reporting_officer",
        active: true,
        mdaId: state.mdas[0]?.id,
        title: "",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.email?.trim()) e.email = "Email is required";
        else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))
          e.email = "Enter a valid email";
        return e;
      }}
      canDelete={(r) =>
        state.assignments.some((a) => a.userId === r.id)
          ? "Remove user assignments first."
          : null
      }
      renderForm={({ value, setField, errors }) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name}>
              <Input
                value={value.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                invalid={!!errors.name}
              />
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={value.email ?? ""}
                onChange={(e) => setField("email", e.target.value)}
                invalid={!!errors.email}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Select
                value={value.role ?? "reporting_officer"}
                onChange={(e) => setField("role", e.target.value as User["role"])}
              >
                <option value="admin">Admin</option>
                <option value="reporting_officer">Reporting officer</option>
                <option value="viewer">Viewer</option>
              </Select>
            </Field>
            <Field label="MDA" hint="Which MDA does this user primarily report for?">
              <Select
                value={value.mdaId ?? ""}
                onChange={(e) => setField("mdaId", e.target.value || undefined)}
              >
                <option value="">— None —</option>
                {state.mdas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Title">
            <Input
              value={value.title ?? ""}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. M&E Officer"
            />
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={value.active ?? true}
                  onChange={(e) => setField("active", e.target.checked)}
                />
                <span className="text-sm">Active account</span>
              </label>
            </div>
          </Field>
        </>
      )}
    />
  );
}
