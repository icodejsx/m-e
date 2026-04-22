export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AuthResponseDto {
  token: string;
  userId: number;
  email: string;
  expiresAt: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
  departmentId?: number;
}

export interface UserDto {
  id: number;
  name: string | null;
  email: string | null;
  departmentId: number;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  departmentId?: number;
}

export interface UpdateUserDto {
  name: string;
  email: string;
  password?: string | null;
  departmentId?: number;
}

export interface ReportClassDto {
  id: number;
  name: string | null;
}
export interface CreateReportClassDto {
  name: string;
}
export interface UpdateReportClassDto {
  name: string;
}

export interface ReportCategoryDto {
  id: number;
  name: string | null;
  reportClassId: number;
}
export interface CreateReportCategoryDto {
  name: string;
  reportClassId?: number;
}
export interface UpdateReportCategoryDto {
  name: string;
  reportClassId?: number;
}

export interface ReportTypeDto {
  id: number;
  name: string | null;
  reportCategoryId: number;
}
export interface CreateReportTypeDto {
  name: string;
  reportCategoryId?: number;
}
export interface UpdateReportTypeDto {
  name: string;
  reportCategoryId?: number;
}

export interface ReportDto {
  id: number;
  reportName: string | null;
  departmentId: number;
  reportCategoryId: number;
  reportTypeId: number;
  frequency: string | null;
}
export interface CreateReportDto {
  reportName: string;
  departmentId?: number;
  reportCategoryId?: number;
  reportTypeId?: number;
  frequency: string;
}
export type UpdateReportDto = CreateReportDto;

export interface ProjectDto {
  id: number;
  projectName: string | null;
  departmentId: number;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string | null;
}
export interface CreateProjectDto {
  projectName: string;
  departmentId?: number;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  status: string;
}
export type UpdateProjectDto = CreateProjectDto;

export interface TargetDto {
  id: number;
  targetName: string | null;
  reportId: number | null;
  projectId: number | null;
  reportingPeriodId: number;
  lgaId: number;
  value: number;
  unitId: number;
  frequency: string | null;
}
export interface CreateTargetDto {
  targetName: string;
  reportId?: number | null;
  projectId?: number | null;
  reportingPeriodId?: number;
  lgaId?: number;
  value?: number;
  unitId?: number;
  frequency: string;
}
export type UpdateTargetDto = CreateTargetDto;

export interface TemplateFieldDto {
  id: number;
  templateId: number;
  fieldName: string | null;
  fieldType: string | null;
  unitId: number | null;
  required: boolean;
  options: string | null;
  frequency: string | null;
}
export interface CreateTemplateFieldDto {
  fieldName: string;
  fieldType: string;
  unitId?: number | null;
  required?: boolean;
  options?: string | null;
  frequency: string;
}

export interface TemplateDto {
  id: number;
  name: string | null;
  type: string | null;
  reportId: number | null;
  projectId: number | null;
  fields: TemplateFieldDto[] | null;
}
export interface CreateTemplateDto {
  name: string;
  type: string;
  reportId?: number | null;
  projectId?: number | null;
}
export type UpdateTemplateDto = CreateTemplateDto;

export interface TemplateDataDto {
  id: number;
  templateFieldId: number;
  targetId: number | null;
  userId: number;
  lgaId: number;
  reportingPeriodId: number;
  value: string | null;
}
export interface UpsertTemplateDataDto {
  id?: number | null;
  templateFieldId: number;
  targetId?: number | null;
  userId: number;
  lgaId: number;
  reportingPeriodId: number;
  value: string;
}

export interface TargetProgressDto {
  id: number;
  targetId: number;
  userId: number;
  reportingPeriodId: number;
  lgaId: number;
  actualValue: number;
  status: string | null;
}
export interface UpsertTargetProgressDto {
  id?: number | null;
  targetId: number;
  userId: number;
  reportingPeriodId: number;
  lgaId: number;
  actualValue?: number;
  status: string;
}

export interface UserReportDto {
  id: number;
  userId: number;
  reportId: number;
}
export interface CreateUserReportDto {
  userId: number;
  reportId: number;
}

export interface UserLgaDto {
  id: number;
  userId: number;
  lgaId: number;
}
export interface CreateUserLgaDto {
  userId: number;
  lgaId: number;
}

export interface ApiError extends Error {
  status: number;
  payload?: unknown;
}
