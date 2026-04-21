export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

export interface MDA extends BaseEntity {
  name: string;
  code: string;
  description?: string;
}

export interface Department extends BaseEntity {
  mdaId: ID;
  name: string;
  code?: string;
  head?: string;
}

export interface ReportClass extends BaseEntity {
  name: string;
  description?: string;
}

export interface ReportCategory extends BaseEntity {
  classId: ID;
  name: string;
  description?: string;
}

export interface ReportType extends BaseEntity {
  categoryId: ID;
  name: string;
  templateId?: ID;
  description?: string;
}

export interface LGA extends BaseEntity {
  name: string;
  state: string;
  code?: string;
}

export interface Unit extends BaseEntity {
  name: string;
  symbol: string;
  description?: string;
}

export type ReportingPeriodStatus = "open" | "closed" | "upcoming";
export interface ReportingPeriod extends BaseEntity {
  name: string;
  startDate: string;
  endDate: string;
  status: ReportingPeriodStatus;
}

export interface FundingSource extends BaseEntity {
  name: string;
  kind: "government" | "donor" | "internal" | "other";
  description?: string;
}

export type ReportStatus = "draft" | "submitted" | "approved" | "rejected";
export interface Report extends BaseEntity {
  title: string;
  mdaId: ID;
  departmentId?: ID;
  typeId: ID;
  periodId: ID;
  status: ReportStatus;
  submittedBy?: ID;
  submittedAt?: string;
  templateId?: ID;
  values?: Record<string, unknown>;
  notes?: string;
}

export type ProjectStatus =
  | "planned"
  | "ongoing"
  | "completed"
  | "on_hold"
  | "cancelled";

export interface Project extends BaseEntity {
  name: string;
  code?: string;
  mdaId: ID;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  lgaIds: ID[];
}

export interface ProjectFunding extends BaseEntity {
  projectId: ID;
  sourceId: ID;
  amount: number;
  currency: string;
  note?: string;
}

export interface Target extends BaseEntity {
  name: string;
  projectId?: ID;
  mdaId: ID;
  unitId: ID;
  periodId: ID;
  baseline: number;
  target: number;
  description?: string;
}

export interface TargetProgress extends BaseEntity {
  targetId: ID;
  periodId: ID;
  value: number;
  note?: string;
  reportedBy?: ID;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"
  | "file"
  | "currency";

export interface TemplateField {
  id: ID;
  label: string;
  key: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  default?: unknown;
}

export interface DynamicTemplate extends BaseEntity {
  name: string;
  description?: string;
  reportTypeId?: ID;
  fields: TemplateField[];
}

export type UserRole = "admin" | "reporting_officer" | "viewer";
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  mdaId?: ID;
  active: boolean;
  title?: string;
}

export interface Assignment extends BaseEntity {
  userId: ID;
  mdaId?: ID;
  departmentId?: ID;
  reportTypeIds: ID[];
  note?: string;
}

export interface AppState {
  mdas: MDA[];
  departments: Department[];
  reportClasses: ReportClass[];
  reportCategories: ReportCategory[];
  reportTypes: ReportType[];
  lgas: LGA[];
  units: Unit[];
  reportingPeriods: ReportingPeriod[];
  fundingSources: FundingSource[];
  reports: Report[];
  projects: Project[];
  projectFundings: ProjectFunding[];
  targets: Target[];
  targetProgress: TargetProgress[];
  templates: DynamicTemplate[];
  users: User[];
  assignments: Assignment[];
  activePeriodId: ID | null;
  activeUserId: ID | null;
}

export type CollectionKey =
  | "mdas"
  | "departments"
  | "reportClasses"
  | "reportCategories"
  | "reportTypes"
  | "lgas"
  | "units"
  | "reportingPeriods"
  | "fundingSources"
  | "reports"
  | "projects"
  | "projectFundings"
  | "targets"
  | "targetProgress"
  | "templates"
  | "users"
  | "assignments";
