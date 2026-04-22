"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReportCategoriesApi,
  ReportClassesApi,
  ReportTypesApi,
  TargetsApi,
  UsersApi,
  ReportsApi,
  ProjectsApi,
  TemplatesApi,
} from "./endpoints";
import type {
  ProjectDto,
  ReportCategoryDto,
  ReportClassDto,
  ReportDto,
  ReportTypeDto,
  TargetDto,
  TemplateDto,
  UserDto,
} from "./types";

interface Fetched<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function useFetch<T>(fn: () => Promise<T>, fallback: T): Fetched<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fnRef.current();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useReportClasses(): Fetched<ReportClassDto[]> {
  return useFetch<ReportClassDto[]>(() => ReportClassesApi.list(), []);
}

export function useReportCategories(
  reportClassId?: number,
): Fetched<ReportCategoryDto[]> {
  return useFetch<ReportCategoryDto[]>(
    async () =>
      (
        await ReportCategoriesApi.list({
          page: 1,
          pageSize: 100,
          reportClassId,
        })
      ).items ?? [],
    [],
  );
}

export function useReportTypes(
  reportCategoryId?: number,
): Fetched<ReportTypeDto[]> {
  return useFetch<ReportTypeDto[]>(
    async () =>
      (
        await ReportTypesApi.list({
          page: 1,
          pageSize: 100,
          reportCategoryId,
        })
      ).items ?? [],
    [],
  );
}

export function useUsers(): Fetched<UserDto[]> {
  return useFetch<UserDto[]>(
    async () => (await UsersApi.list({ page: 1, pageSize: 100 })).items ?? [],
    [],
  );
}

export function useReports(): Fetched<ReportDto[]> {
  return useFetch<ReportDto[]>(
    async () => (await ReportsApi.list({ page: 1, pageSize: 100 })).items ?? [],
    [],
  );
}

export function useProjects(): Fetched<ProjectDto[]> {
  return useFetch<ProjectDto[]>(
    async () =>
      (await ProjectsApi.list({ page: 1, pageSize: 100 })).items ?? [],
    [],
  );
}

export function useTargets(): Fetched<TargetDto[]> {
  return useFetch<TargetDto[]>(
    async () => (await TargetsApi.list({ page: 1, pageSize: 100 })).items ?? [],
    [],
  );
}

export function useTemplates(): Fetched<TemplateDto[]> {
  return useFetch<TemplateDto[]>(
    async () =>
      (await TemplatesApi.list({ page: 1, pageSize: 100 })).items ?? [],
    [],
  );
}
