"use client";

import { UserCog, RefreshCcw, Trash2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/RowActions";
import { AssignmentsApi, DepartmentsApi } from "@/lib/api/endpoints";
import { useReports, useUsers } from "@/lib/api/hooks";
import { useModal } from "@/lib/modal";
import { useToast } from "@/lib/toast";
import type {
  CreateUserDepartmentDto,
  CreateUserLgaDto,
  CreateUserReportDto,
  DepartmentDto,
  UserDepartmentDto,
  UserLgaDto,
  UserReportDto,
} from "@/lib/api/types";

export default function AssignmentsPage() {
  const modal = useModal();
  const toast = useToast();
  const { data: users } = useUsers();
  const { data: reports } = useReports();

  const [reportAssignments, setReportAssignments] = useState<UserReportDto[]>(
    [],
  );
  const [lgaAssignments, setLgaAssignments] = useState<UserLgaDto[]>([]);
  const [departmentAssignments, setDepartmentAssignments] = useState<
    UserDepartmentDto[]
  >([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, l, d, deptPage] = await Promise.all([
        AssignmentsApi.listUserReports({ page: 1, pageSize: 100 }),
        AssignmentsApi.listUserLgas({ page: 1, pageSize: 100 }),
        AssignmentsApi.listUserDepartments({ page: 1, pageSize: 100 }),
        DepartmentsApi.list({ page: 1, pageSize: 200 }),
      ]);
      setReportAssignments(r.items ?? []);
      setLgaAssignments(l.items ?? []);
      setDepartmentAssignments(d.items ?? []);
      setDepartments(deptPage.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function userLabel(id: number) {
    const u = users.find((x) => x.id === id);
    return u ? `${u.name} (${u.email})` : `User #${id}`;
  }

  function reportLabel(id: number) {
    const r = reports.find((x) => x.id === id);
    return r ? `${r.reportName} (#${r.id})` : `Report #${id}`;
  }

  function departmentLabel(id: number) {
    const x = departments.find((d) => d.id === id);
    const n = x?.name ?? x?.departmentName;
    return n ? `${n} (#${id})` : `Department #${id}`;
  }

  function openNewReportAssignment() {
    modal.open({
      title: "Assign user to report",
      size: "md",
      body: (
        <AssignmentForm<CreateUserReportDto>
          initial={{ userId: users[0]?.id ?? 0, reportId: reports[0]?.id ?? 0 }}
          onCancel={() => modal.close()}
          onSave={async (v) => {
            try {
              await AssignmentsApi.createUserReport(v);
              toast.success("Assignment added");
              modal.close();
              await reload();
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
            }
          }}
          fields={[
            {
              key: "userId",
              label: "User",
              options: users.map((u) => ({
                value: u.id,
                label: userLabel(u.id),
              })),
            },
            {
              key: "reportId",
              label: "Report",
              options: reports.map((r) => ({
                value: r.id,
                label: reportLabel(r.id),
              })),
            },
          ]}
        />
      ),
    });
  }

  function openNewDepartmentAssignment() {
    modal.open({
      title: "Assign user to department",
      size: "md",
      body: (
        <AssignmentForm<CreateUserDepartmentDto>
          initial={{
            userId: users[0]?.id ?? 0,
            departmentId: departments[0]?.id ?? 0,
          }}
          onCancel={() => modal.close()}
          onSave={async (v) => {
            try {
              await AssignmentsApi.createUserDepartment(v);
              toast.success("Department assignment added");
              modal.close();
              await reload();
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
            }
          }}
          fields={[
            {
              key: "userId",
              label: "User",
              options: users.map((u) => ({
                value: u.id,
                label: userLabel(u.id),
              })),
            },
            {
              key: "departmentId",
              label: "Department",
              options: departments.map((d) => ({
                value: d.id,
                label: departmentLabel(d.id),
              })),
            },
          ]}
        />
      ),
    });
  }

  function openNewLgaAssignment() {
    modal.open({
      title: "Assign user to location",
      size: "md",
      body: (
        <LgaAssignmentForm
          users={users}
          onCancel={() => modal.close()}
          onSave={async (v) => {
            try {
              await AssignmentsApi.createUserLga(v);
              toast.success("Location assignment added");
              modal.close();
              await reload();
            } catch (e) {
              toast.error(
                "Save failed",
                e instanceof Error ? e.message : "Unexpected error",
              );
            }
          }}
        />
      ),
    });
  }

  async function removeReport(id: number) {
    const ok = await modal.confirm({
      title: "Remove report assignment?",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await AssignmentsApi.removeUserReport(id);
      toast.success("Removed");
      await reload();
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  async function removeDepartment(id: number) {
    const ok = await modal.confirm({
      title: "Remove department assignment?",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await AssignmentsApi.removeUserDepartment(id);
      toast.success("Removed");
      await reload();
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  async function removeLga(id: number) {
    const ok = await modal.confirm({
      title: "Remove location assignment?",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await AssignmentsApi.removeUserLga(id);
      toast.success("Removed");
      await reload();
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof Error ? e.message : "Unexpected error",
      );
    }
  }

  return (
    <div>
      <PageHeader
        icon={<UserCog className="h-5 w-5" />}
        title="User Assignments"
        subtitle="Scope users to reports, locations (LGAs), and departments they are allowed to operate on."
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCcw className="h-4 w-4" />}
            onClick={reload}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="User ↔ Report"
            subtitle="Reports each user is allowed to submit."
            actions={
              <Button
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={openNewReportAssignment}
              >
                Add
              </Button>
            }
          />
          <CardBody className="p-0">
            {reportAssignments.length === 0 ? (
              <EmptyState
                className="m-4"
                title={loading ? "Loading…" : "No assignments"}
              />
            ) : (
              <ul className="divide-y">
                {reportAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {userLabel(a.userId)}
                      </div>
                      <div className="mt-0.5 text-xs muted">
                        <Badge tone="brand">
                          {a.reportName?.trim()
                            ? `${a.reportName} (#${a.reportId})`
                            : reportLabel(a.reportId)}
                        </Badge>
                      </div>
                    </div>
                    <IconButton
                      tone="danger"
                      title="Remove"
                      onClick={() => removeReport(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="User ↔ Location"
            subtitle="Locations (LGAs) each user is authorised to report on."
            actions={
              <Button
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={openNewLgaAssignment}
              >
                Add
              </Button>
            }
          />
          <CardBody className="p-0">
            {lgaAssignments.length === 0 ? (
              <EmptyState
                className="m-4"
                title={loading ? "Loading…" : "No assignments"}
              />
            ) : (
              <ul className="divide-y">
                {lgaAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {userLabel(a.userId)}
                      </div>
                      <div className="mt-0.5 text-xs muted">
                        <Badge tone="info">
                          {a.locationName ??
                            `Location #${a.locationId}`}
                        </Badge>
                      </div>
                    </div>
                    <IconButton
                      tone="danger"
                      title="Remove"
                      onClick={() => removeLga(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="User ↔ Department"
            subtitle="Departments each user is associated with."
            actions={
              <Button
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={openNewDepartmentAssignment}
                disabled={departments.length === 0}
              >
                Add
              </Button>
            }
          />
          <CardBody className="p-0">
            {departmentAssignments.length === 0 ? (
              <EmptyState
                className="m-4"
                title={loading ? "Loading…" : "No assignments"}
              />
            ) : (
              <ul className="divide-y">
                {departmentAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {userLabel(a.userId)}
                      </div>
                      <div className="mt-0.5 text-xs muted">
                        <Badge tone="neutral">
                          {a.departmentName?.trim()
                            ? `${a.departmentName} (#${a.departmentId})`
                            : departmentLabel(a.departmentId)}
                        </Badge>
                      </div>
                    </div>
                    <IconButton
                      tone="danger"
                      title="Remove"
                      onClick={() => removeDepartment(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

interface FieldSpec<V> {
  key: keyof V;
  label: string;
  options: { value: number; label: string }[];
}

function AssignmentForm<V extends object>({
  initial,
  fields,
  onCancel,
  onSave,
}: {
  initial: V;
  fields: FieldSpec<V>[];
  onCancel: () => void;
  onSave: (v: V) => Promise<void>;
}) {
  const [value, setValue] = useState<V>(initial);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(value);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {fields.map((f) => (
        <Field key={String(f.key)} label={f.label} required>
          <Select
            value={String(value[f.key] ?? "")}
            onChange={(e) =>
              setValue((prev) => ({
                ...prev,
                [f.key]: Number(e.target.value) || 0,
              }) as V)
            }
          >
            <option value="">— Select —</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      ))}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save
        </Button>
      </div>
    </form>
  );
}

function LgaAssignmentForm({
  users,
  onCancel,
  onSave,
}: {
  users: { id: number; name: string | null; email: string | null }[];
  onCancel: () => void;
  onSave: (v: CreateUserLgaDto) => Promise<void>;
}) {
  const [userId, setUserId] = useState<number>(users[0]?.id ?? 0);
  const [locationId, setLocationId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !locationId) return;
    setSubmitting(true);
    try {
      await onSave({ userId, locationId: Number(locationId) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="User" required>
        <Select
          value={String(userId)}
          onChange={(e) => setUserId(Number(e.target.value) || 0)}
        >
          <option value="">— Select —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Location ID" required hint="Numeric location / LGA identifier">
        <Input
          type="number"
          min={1}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          placeholder="1"
        />
      </Field>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
