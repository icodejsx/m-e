import { apiRequest, paged } from "./client";
import type {
  AuthResponseDto,
  CreateProjectDto,
  CreateReportCategoryDto,
  CreateReportClassDto,
  CreateReportDto,
  CreateReportTypeDto,
  CreateTargetDto,
  CreateTemplateDto,
  CreateTemplateFieldDto,
  CreateUserDto,
  CreateUserLgaDto,
  CreateUserReportDto,
  LoginRequestDto,
  PagedResult,
  ProjectDto,
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
  UserDto,
  UserLgaDto,
  UserReportDto,
} from "./types";

export type PageParams = { page?: number; pageSize?: number };

export const AuthApi = {
  login: (body: LoginRequestDto) =>
    apiRequest<AuthResponseDto>("/Auth/login", { method: "POST", body, auth: false }),
  register: (body: RegisterRequestDto) =>
    apiRequest<AuthResponseDto>("/Auth/register", { method: "POST", body, auth: false }),
};

export const UsersApi = {
  list: (q: PageParams & { departmentId?: number } = {}) =>
    paged<UserDto>("/Users", q),
  get: (id: number) => apiRequest<UserDto>(`/Users/${id}`),
  create: (body: CreateUserDto) =>
    apiRequest<UserDto>("/Users", { method: "POST", body }),
  update: (id: number, body: UpdateUserDto) =>
    apiRequest<UserDto>(`/Users/${id}`, { method: "PUT", body }),
  remove: (id: number) => apiRequest<void>(`/Users/${id}`, { method: "DELETE" }),
};

export const ReportClassesApi = {
  list: () => apiRequest<ReportClassDto[]>("/ReportClasses"),
  create: (body: CreateReportClassDto) =>
    apiRequest<ReportClassDto>("/ReportClasses", { method: "POST", body }),
  update: (id: number, body: UpdateReportClassDto) =>
    apiRequest<ReportClassDto>(`/ReportClasses/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/ReportClasses/${id}`, { method: "DELETE" }),
};

export const ReportCategoriesApi = {
  list: (q: PageParams & { reportClassId?: number } = {}) =>
    paged<ReportCategoryDto>("/ReportCategories", q),
  create: (body: CreateReportCategoryDto) =>
    apiRequest<ReportCategoryDto>("/ReportCategories", { method: "POST", body }),
  update: (id: number, body: UpdateReportCategoryDto) =>
    apiRequest<ReportCategoryDto>(`/ReportCategories/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/ReportCategories/${id}`, { method: "DELETE" }),
};

export const ReportTypesApi = {
  list: (q: PageParams & { reportCategoryId?: number } = {}) =>
    paged<ReportTypeDto>("/ReportTypes", q),
  create: (body: CreateReportTypeDto) =>
    apiRequest<ReportTypeDto>("/ReportTypes", { method: "POST", body }),
  update: (id: number, body: UpdateReportTypeDto) =>
    apiRequest<ReportTypeDto>(`/ReportTypes/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/ReportTypes/${id}`, { method: "DELETE" }),
};

export const ReportsApi = {
  list: (q: PageParams & { departmentId?: number } = {}) =>
    paged<ReportDto>("/Reports", q),
  get: (id: number) => apiRequest<ReportDto>(`/Reports/${id}`),
  create: (body: CreateReportDto) =>
    apiRequest<ReportDto>("/Reports", { method: "POST", body }),
  update: (id: number, body: UpdateReportDto) =>
    apiRequest<ReportDto>(`/Reports/${id}`, { method: "PUT", body }),
  remove: (id: number) => apiRequest<void>(`/Reports/${id}`, { method: "DELETE" }),
  typesByCategory: (reportCategoryId: number) =>
    apiRequest<ReportTypeDto[]>(`/Reports/types/by-category/${reportCategoryId}`),
};

export const ProjectsApi = {
  list: (q: PageParams & { departmentId?: number } = {}) =>
    paged<ProjectDto>("/Projects", q),
  get: (id: number) => apiRequest<ProjectDto>(`/Projects/${id}`),
  create: (body: CreateProjectDto) =>
    apiRequest<ProjectDto>("/Projects", { method: "POST", body }),
  update: (id: number, body: UpdateProjectDto) =>
    apiRequest<ProjectDto>(`/Projects/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/Projects/${id}`, { method: "DELETE" }),
};

export const TargetsApi = {
  list: (
    q: PageParams & {
      reportId?: number;
      projectId?: number;
      lgaId?: number;
    } = {},
  ) => paged<TargetDto>("/Targets", q),
  get: (id: number) => apiRequest<TargetDto>(`/Targets/${id}`),
  create: (body: CreateTargetDto) =>
    apiRequest<TargetDto>("/Targets", { method: "POST", body }),
  update: (id: number, body: UpdateTargetDto) =>
    apiRequest<TargetDto>(`/Targets/${id}`, { method: "PUT", body }),
  remove: (id: number) => apiRequest<void>(`/Targets/${id}`, { method: "DELETE" }),
  computedActual: (
    id: number,
    q: { reportingPeriodId?: number; lgaId?: number } = {},
  ) =>
    apiRequest<number>(`/Targets/${id}/computed-actual`, { query: q }),
};

export const TemplatesApi = {
  list: (
    q: PageParams & { reportId?: number; projectId?: number } = {},
  ) => paged<TemplateDto>("/Templates", q),
  get: (id: number) => apiRequest<TemplateDto>(`/Templates/${id}`),
  create: (body: CreateTemplateDto) =>
    apiRequest<TemplateDto>("/Templates", { method: "POST", body }),
  update: (id: number, body: UpdateTemplateDto) =>
    apiRequest<TemplateDto>(`/Templates/${id}`, { method: "PUT", body }),
  remove: (id: number) =>
    apiRequest<void>(`/Templates/${id}`, { method: "DELETE" }),
  addField: (templateId: number, body: CreateTemplateFieldDto) =>
    apiRequest<TemplateFieldDto>(`/Templates/${templateId}/fields`, {
      method: "POST",
      body,
    }),
  removeField: (templateId: number, fieldId: number) =>
    apiRequest<void>(`/Templates/${templateId}/fields/${fieldId}`, {
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
  ) => paged<TemplateDataDto>("/TemplateData", q),
  get: (id: number) => apiRequest<TemplateDataDto>(`/TemplateData/${id}`),
  upsert: (body: UpsertTemplateDataDto) =>
    apiRequest<TemplateDataDto>("/TemplateData", { method: "POST", body }),
  remove: (id: number) =>
    apiRequest<void>(`/TemplateData/${id}`, { method: "DELETE" }),
};

export const TargetProgressApi = {
  list: (q: PageParams & { targetId?: number } = {}) =>
    paged<TargetProgressDto>("/TargetProgress", q),
  get: (id: number) => apiRequest<TargetProgressDto>(`/TargetProgress/${id}`),
  upsert: (body: UpsertTargetProgressDto) =>
    apiRequest<TargetProgressDto>("/TargetProgress", { method: "POST", body }),
  recalculate: (q: {
    targetId: number;
    userId: number;
    reportingPeriodId: number;
    lgaId: number;
  }) =>
    apiRequest<TargetProgressDto>("/TargetProgress/recalculate", {
      method: "POST",
      query: q,
    }),
  remove: (id: number) =>
    apiRequest<void>(`/TargetProgress/${id}`, { method: "DELETE" }),
};

export const AssignmentsApi = {
  listUserReports: (q: PageParams & { userId?: number } = {}) =>
    paged<UserReportDto>("/Assignments/user-reports", q),
  createUserReport: (body: CreateUserReportDto) =>
    apiRequest<UserReportDto>("/Assignments/user-reports", {
      method: "POST",
      body,
    }),
  removeUserReport: (id: number) =>
    apiRequest<void>(`/Assignments/user-reports/${id}`, { method: "DELETE" }),
  listUserLgas: (q: PageParams & { userId?: number } = {}) =>
    paged<UserLgaDto>("/Assignments/user-lgas", q),
  createUserLga: (body: CreateUserLgaDto) =>
    apiRequest<UserLgaDto>("/Assignments/user-lgas", { method: "POST", body }),
  removeUserLga: (id: number) =>
    apiRequest<void>(`/Assignments/user-lgas/${id}`, { method: "DELETE" }),
};

export type {
  AuthResponseDto,
  LoginRequestDto,
  PagedResult,
  RegisterRequestDto,
};
