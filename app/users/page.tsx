"use client";

import { Users as UsersIcon } from "lucide-react";
import { RemoteResourcePage } from "@/components/resource/RemoteResourcePage";
import { Field, Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { UsersApi } from "@/lib/api/endpoints";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserDto,
} from "@/lib/api/types";

type UserForm = CreateUserDto & { _mode?: "create" | "update" };

export default function UsersPage() {
  return (
    <RemoteResourcePage<UserDto, UserForm>
      icon={<UsersIcon className="h-5 w-5" />}
      title="Users"
      subtitle="Users registered on the M&E platform."
      singular="User"
      modalSize="md"
      fetchPage={({ page, pageSize }) => UsersApi.list({ page, pageSize })}
      create={(v) =>
        UsersApi.create({
          name: v.name,
          email: v.email,
          password: v.password,
          departmentId: v.departmentId,
        })
      }
      update={(id, v) => {
        const body: UpdateUserDto = {
          name: v.name,
          email: v.email,
          departmentId: v.departmentId,
          password: v.password ? v.password : null,
        };
        return UsersApi.update(id, body);
      }}
      remove={(id) => UsersApi.remove(id)}
      toFormValue={(r) => ({
        name: r.name ?? "",
        email: r.email ?? "",
        password: "",
        departmentId: r.departmentId,
        _mode: "update",
      })}
      defaultValue={() => ({
        name: "",
        email: "",
        password: "",
        _mode: "create",
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        if (!v.name?.trim()) e.name = "Name is required";
        if (!v.email?.trim()) e.email = "Email is required";
        else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))
          e.email = "Enter a valid email";
        if (v._mode === "create") {
          if (!v.password) e.password = "Password is required";
          else if (v.password.length < 8)
            e.password = "Minimum 8 characters";
        } else if (v.password && v.password.length < 8) {
          e.password = "Minimum 8 characters or leave blank";
        }
        return e;
      }}
      columns={[
        {
          key: "id",
          header: "ID",
          width: "80px",
          render: (r) => <span className="muted tabular-nums">#{r.id}</span>,
          sortBy: (r) => Number(r.id),
        },
        {
          key: "name",
          header: "Name",
          render: (r) => (
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-brand-50)] text-xs font-semibold text-[var(--color-brand-700)] dark:bg-[var(--color-brand-500)]/10 dark:text-[var(--color-brand-300)]">
                {(r.name || "U")
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name ?? "—"}</div>
                <div className="truncate text-xs muted">{r.email ?? "—"}</div>
              </div>
            </div>
          ),
          sortBy: (r) => r.name ?? "",
        },
        {
          key: "dept",
          header: "Department",
          render: (r) => <Badge tone="brand">Dept #{r.departmentId}</Badge>,
          sortBy: (r) => r.departmentId,
        },
      ]}
      renderForm={({ value, setField, errors, existing }) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name}>
              <Input
                value={value.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                invalid={!!errors.name}
                maxLength={256}
              />
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={value.email ?? ""}
                onChange={(e) => setField("email", e.target.value)}
                invalid={!!errors.email}
                maxLength={256}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={existing ? "New password" : "Password"}
              required={!existing}
              error={errors.password}
              hint={
                existing
                  ? "Leave blank to keep current password"
                  : "Min. 8 characters"
              }
            >
              <Input
                type="password"
                value={value.password ?? ""}
                onChange={(e) => setField("password", e.target.value)}
                invalid={!!errors.password}
                minLength={8}
                maxLength={256}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Department ID" hint="Numeric ID">
              <Input
                type="number"
                min={1}
                value={value.departmentId ?? ""}
                onChange={(e) =>
                  setField(
                    "departmentId",
                    Number(e.target.value) || undefined,
                  )
                }
              />
            </Field>
          </div>
        </>
      )}
    />
  );
}
