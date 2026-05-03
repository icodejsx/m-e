import { apiRequest, paged } from "./client";
import type {
  AuthResponseDto,
  CreateFundingSourceDto,
  CreateProjectDto,
  CreateReportCategoryDto,
  CreateReportClassDto,
  CreateReportDto,
  CreateReportTypeDto,
  CreateTargetDto,
  CreateTemplateDto,
  CreateTemplateFieldDto,
  CreateUserDepartmentDto,
  CreateUserDto,
  CreateUserLgaDto,
  CreateUserReportDto,
  DepartmentDto,
  FundingSourceDto,
  LoginRequestDto,
  PagedResult,
  ProjectDto,
  ProjectListItemDto,
  RegisterRequestDto,
  ReportCategoryDto,
  ReportClassDto,
  ReportDto,
  ReportTypeDto,
  TargetDto,
  TargetProgressDto,
  TemplateDataDto,
  TemplateDto,
  TemplateFieldDto,
  UpdateFundingSourceDto,
  UpdateProjectDto,
  UpdateReportCategoryDto,
  UpdateReportClassDto,
  UpdateReportDto,
  UpdateReportTypeDto,
  UpdateTargetDto,
  UpdateTemplateDto,
  UpdateUserDto,
  UpsertTargetProgressDto,
  UpsertTemplateDataDto,
  UserDepartmentDto,
  UserDto,
  UserLgaDto,
  UserReportDto,
} from "./types";

export type PageParams = { page?: number; pageSize?: number };

export const AuthApi = {
  login: (body: LoginRequestDto) =>
    apiRequest<AuthResponseDto>("/auth/login", { method: "POST", body, auth: false }),
  register: (body: RegisterRequestDto) =>
    apiRequest<AuthResponseDto>("/auth/register", { method: "POST", body, auth: false }),
};

export const DepartmentsApi = {
  list: (q: PageParams = {}) => paged<DepartmentDto>("/departments", q),
};

export const UsersApi = {
  list: (q: PageParams & { departmentId?: number } = {}) =>
    paged<UserDto>("/users", q),
  get: (id: number) => apiRequest<UserDto>(`/users/${id}`),
  create: (body: CreateUserDto) =>
    apiRequest<UserDto>("/users", { method: "POST", body }),
  update: (id: number, body: UpdateUserDto) =>
    apiRequest<UserDto>(`/users/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/users/${id}`, { method: "DELETE" }),
};

export const ReportClassesApi = {
  list: () => apiRequest<ReportClassDto[]>("/report-classes"),
  create: (body: CreateReportClassDto) =>
    apiRequest<ReportClassDto>("/report-classes", { method: "POST", body }),
  update: (id: number, body: UpdateReportClassDto) =>
    apiRequest<ReportClassDto>(`/report-classes/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/report-classes/${id}`, { method: "DELETE" }),
};

export const ReportCategoriesApi = {
  list: (q: PageParams & { reportClassId?: number } = {}) =>
    paged<ReportCategoryDto>("/report-categories", q),
  create: (body: CreateReportCategoryDto) =>
    apiRequest<ReportCategoryDto>("/report-categories", { method: "POST", body }),
  update: (id: number, body: UpdateReportCategoryDto) =>
    apiRequest<ReportCategoryDto>(`/report-categories/${id}`, {
      method: "PUT",
      body,
    }),
  remove: (id: number) =>
    apiRequest<void>(`/report-categories/${id}`, { method: "DELETE" }),
};

export const ReportTypesApi = {
  list: (q: PageParams & { reportCategoryId?: number } = {}) =>
    paged<ReportTypeDto>("/report-types", q),
  create: (body: CreateReportTypeDto) =>
    apiRequest<ReportTypeDto>("/report-types", { method: "POST", body }),
  update: (id: number, body: UpdateReportTypeDto) =>
    apiRequest<ReportTypeDto>(`/report-types/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/report-types/${id}`, { method: "DELETE" }),
};

export const ReportsApi = {
  list: (
    q: PageParams & {
      departmentId?: number;
      mdaId?: number;
      categoryId?: number;
      name?: string;
      reportKind?: string;
    } = {},
  ) => paged<ReportDto>("/reports", q),
  get: (id: number) => apiRequest<ReportDto>(`/reports/${id}`),
  create: (body: CreateReportDto) =>
    apiRequest<ReportDto>("/reports", { method: "POST", body }),
  update: (id: number, body: UpdateReportDto) =>
    apiRequest<ReportDto>(`/reports/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/reports/${id}`, { method: "DELETE" }),
  typesByCategory: (reportCategoryId: number) =>
    apiRequest<ReportTypeDto[]>(
      `/reports/types/by-category/${reportCategoryId}`,
    ),
};

export const ProjectsApi = {
  list: (
    q: PageParams & {
      departmentId?: number;
      mdaId?: number;
      name?: string;
    } = {},
  ) => paged<ProjectDto>("/projects", q),
  listFlat: (q: { departmentId?: number; mdaId?: number } = {}) =>
    apiRequest<ProjectListItemDto[]>("/projects/list", { query: q }),
  get: (id: number) => apiRequest<ProjectDto>(`/projects/${id}`),
  create: (body: CreateProjectDto) =>
    apiRequest<ProjectDto>("/projects", { method: "POST", body }),
  update: (id: number, body: UpdateProjectDto) =>
    apiRequest<ProjectDto>(`/projects/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/projects/${id}`, { method: "DELETE" }),
};

export const FundingSourcesApi = {
  list: (q: PageParams & { year?: number } = {}) =>
    paged<FundingSourceDto>("/funding-sources", q),
  get: (id: number) =>
    apiRequest<FundingSourceDto>(`/funding-sources/${id}`),
  create: (body: CreateFundingSourceDto) =>
    apiRequest<FundingSourceDto>("/funding-sources", {
      method: "POST",
      body,
    }),
  update: (id: number, body: UpdateFundingSourceDto) =>
    apiRequest<FundingSourceDto>(`/funding-sources/${id}`, {
      method: "PUT",
      body,
    }),
  remove: (id: number) =>
    apiRequest<void>(`/funding-sources/${id}`, { method: "DELETE" }),
};

export const TargetsApi = {
  list: (
    q: PageParams & {
      reportId?: number;
      projectId?: number;
      locationId?: number;
    } = {},
  ) => paged<TargetDto>("/targets", q),
  get: (id: number) => apiRequest<TargetDto>(`/targets/${id}`),
  create: (body: CreateTargetDto) =>
    apiRequest<TargetDto>("/targets", { method: "POST", body }),
  update: (id: number, body: UpdateTargetDto) =>
    apiRequest<TargetDto>(`/targets/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/targets/${id}`, { method: "DELETE" }),
  computedActual: (
    id: number,
    q: { reportingPeriodId?: number; locationId?: number } = {},
  ) =>
    apiRequest<number>(`/targets/${id}/computed-actual`, { query: q }),
};

export const TemplatesApi = {
  list: (
    q: PageParams & { reportId?: number; projectId?: number } = {},
  ) => paged<TemplateDto>("/templates", q),
  get: (id: number) => apiRequest<TemplateDto>(`/templates/${id}`),
  create: (body: CreateTemplateDto) =>
    apiRequest<TemplateDto>("/templates", { method: "POST", body }),
  update: (id: number, body: UpdateTemplateDto) =>
    apiRequest<TemplateDto>(`/templates/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/templates/${id}`, { method: "DELETE" }),
  addField: (templateId: number, body: CreateTemplateFieldDto) =>
    apiRequest<TemplateFieldDto>(`/templates/${templateId}/fields`, {
      method: "POST",
      body,
    }),
  removeField: (templateId: number, fieldId: number) =>
    apiRequest<void>(`/templates/${templateId}/fields/${fieldId}`, {
      method: "DELETE",
    }),
};

export const TemplateDataApi = {
  list: (
    q: PageParams & {
      templateFieldId?: number;
      targetId?: number;
      reportingPeriodId?: number;
    } = {},
  ) => paged<TemplateDataDto>("/template-data", q),
  get: (id: number) =>
    apiRequest<TemplateDataDto>(`/template-data/${id}`),
  upsert: (body: UpsertTemplateDataDto) =>
    apiRequest<TemplateDataDto>("/template-data", { method: "POST", body }),
  remove: (id: number) =>
    apiRequest<void>(`/template-data/${id}`, { method: "DELETE" }),
};

export const TargetProgressApi = {
  list: (q: PageParams & { targetId?: number } = {}) =>
    paged<TargetProgressDto>("/target-progress", q),
  get: (id: number) =>
    apiRequest<TargetProgressDto>(`/target-progress/${id}`),
  upsert: (body: UpsertTargetProgressDto) =>
    apiRequest<TargetProgressDto>("/target-progress", {
      method: "POST",
      body,
    }),
  recalculate: (q: {
    targetId: number;
    userId: number;
    reportingPeriodId: number;
    locationId: number;
  }) =>
    apiRequest<TargetProgressDto>("/target-progress/recalculate", {
      method: "POST",
      query: q,
    }),
  remove: (id: number) =>
    apiRequest<void>(`/target-progress/${id}`, { method: "DELETE" }),
};

export const AssignmentsApi = {
  listUserReports: (
    q: PageParams & { userId?: number; search?: string } = {},
  ) => paged<UserReportDto>("/assignments/user-reports", q),
  createUserReport: (body: CreateUserReportDto) =>
    apiRequest<UserReportDto>("/assignments/user-reports", {
      method: "POST",
      body,
    }),
  removeUserReport: (id: number) =>
    apiRequest<void>(`/assignments/user-reports/${id}`, {
      method: "DELETE",
    }),
  listUserLgas: (
    q: PageParams & { userId?: number; search?: string } = {},
  ) => paged<UserLgaDto>("/assignments/user-lgas", q),
  createUserLga: (body: CreateUserLgaDto) =>
    apiRequest<UserLgaDto>("/assignments/user-lgas", {
      method: "POST",
      body,
    }),
  removeUserLga: (id: number) =>
    apiRequest<void>(`/assignments/user-lgas/${id}`, { method: "DELETE" }),

  listUserDepartments: (
    q: PageParams & { userId?: number; search?: string } = {},
  ) => paged<UserDepartmentDto>("/assignments/user-departments", q),
  createUserDepartment: (body: CreateUserDepartmentDto) =>
    apiRequest<UserDepartmentDto>("/assignments/user-departments", {
      method: "POST",
      body,
    }),
  removeUserDepartment: (id: number) =>
    apiRequest<void>(`/assignments/user-departments/${id}`, {
      method: "DELETE",
    }),
};

export type {
  AuthResponseDto,
  LoginRequestDto,
  PagedResult,
  RegisterRequestDto,
};
