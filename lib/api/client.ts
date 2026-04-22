import { API_BASE_URL, AUTH_TOKEN_KEY } from "./config";
import type { ApiError, PagedResult } from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const base = API_BASE_URL;
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  const isAbsoluteBase = /^https?:\/\//i.test(base);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = isAbsoluteBase
    ? new URL(`${base}${trimmed}`)
    : new URL(`${base}${trimmed}`, origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return isAbsoluteBase ? url.toString() : `${url.pathname}${url.search}`;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { token?: unknown };
      if (parsed && typeof parsed.token === "string") return parsed.token;
    } catch {
      // Not JSON — fall through and treat the value itself as the token.
    }
    return typeof raw === "string" ? raw : null;
  } catch {
    return null;
  }
}

type AuthListener = (authed: boolean) => void;
const authListeners = new Set<AuthListener>();
export function onAuthChange(fn: AuthListener): () => void {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}
function emitUnauthorized() {
  authListeners.forEach((l) => {
    try {
      l(false);
    } catch {}
  });
}

function makeApiError(
  message: string,
  status: number,
  payload?: unknown,
): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.payload = payload;
  return err;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", query, body, signal, auth = true } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    throw makeApiError(`Network error: ${message}`, 0);
  }

  if (res.status === 401) {
    emitUnauthorized();
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {}
    throw makeApiError("Your session has expired. Please sign in again.", 401, payload);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const payload = data as { error?: string; title?: string; errors?: unknown } | string | undefined;
    let message = `Request failed (${res.status})`;
    if (typeof payload === "string" && payload.trim()) message = payload;
    else if (payload && typeof payload === "object") {
      if ("error" in payload && typeof payload.error === "string") message = payload.error;
      else if ("title" in payload && typeof payload.title === "string") message = payload.title;
    }
    throw makeApiError(message, res.status, data);
  }

  return data as T;
}

export function paged<T>(
  path: string,
  query?: RequestOptions["query"],
  signal?: AbortSignal,
): Promise<PagedResult<T>> {
  return apiRequest<PagedResult<T>>(path, { query, signal });
}
