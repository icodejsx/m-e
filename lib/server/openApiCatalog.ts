/**
 * Loads OpenAPI 3 spec from the M&E backend (Swagger) and builds a compact digest + GET allowlist.
 * Spec URL matches Swagger UI: https://app-service.icadpays.com/swagger/index.html
 * Default JSON: /swagger/v1/swagger.json
 */

const CACHE_MS = 30 * 60 * 1000;
const DEFAULT_SPEC_PATH = "/swagger/v1/swagger.json";

type Cached = {
  digest: string;
  getPaths: string[];
  fetchedAt: number;
};

let cache: Cached | null = null;
let inflight: Promise<Cached> | null = null;

export function resolveOpenApiSpecUrl(backendOrigin: string): string {
  const custom = process.env.OPENAPI_SPEC_URL?.trim();
  if (custom) return custom;
  const base = backendOrigin.replace(/\/+$/, "");
  return `${base}${DEFAULT_SPEC_PATH}`;
}

function normalizePath(p: string): string {
  let x = p.trim();
  if (!x.startsWith("/")) x = `/${x}`;
  x = x.replace(/\/+$/, "") || "/";
  if (x.includes("..") || x.includes("//")) throw new Error("Invalid path");
  return x;
}

/** Match actual request path to an OpenAPI path template (handles `{id}` segments). */
export function matchOpenApiTemplate(
  actualPath: string,
  templates: readonly string[],
): string | null {
  const norm = normalizePath(actualPath);
  const a = norm.split("/").filter(Boolean);
  for (const tpl of templates) {
    const t = normalizePath(tpl).split("/").filter(Boolean);
    if (a.length !== t.length) continue;
    let ok = true;
    for (let i = 0; i < t.length; i++) {
      const ts = t[i];
      if (ts.startsWith("{") && ts.endsWith("}")) continue;
      if (a[i] !== ts) {
        ok = false;
        break;
      }
    }
    if (ok) return tpl;
  }
  return null;
}

function buildDigest(doc: unknown, maxChars: number): { digest: string; getPaths: string[] } {
  if (!doc || typeof doc !== "object") {
    return {
      digest: "(OpenAPI document missing `paths`.)",
      getPaths: [],
    };
  }
  const paths = (doc as { paths?: Record<string, Record<string, unknown>> }).paths;
  if (!paths || typeof paths !== "object") {
    return { digest: "(OpenAPI spec has no paths.)", getPaths: [] };
  }

  const lines: string[] = [];
  const getPaths: string[] = [];

  for (const path of Object.keys(paths).sort()) {
    const ops = paths[path];
    const get = ops?.get as
      | { tags?: string[]; summary?: string; description?: string }
      | undefined;
    if (!get) continue;
    getPaths.push(path);
    const tag = get.tags?.[0] ?? "Other";
    const blurb = (get.summary || get.description || "").replace(/\s+/g, " ").trim();
    lines.push(`[${tag}] GET ${path}${blurb ? ` — ${blurb}` : ""}`);
  }

  let digest = [
    "Below is a condensed catalog of GET endpoints from the deployed M&E OpenAPI spec.",
    "When you need live server data, call `backend_api_get` with an exact path below and optional query params (e.g. Page, PageSize).",
    "---",
    ...lines,
  ].join("\n");

  if (digest.length > maxChars) {
    digest = `${digest.slice(0, maxChars)}\n\n...[digest truncated]`;
  }

  return { digest, getPaths };
}

async function fetchCatalog(backendOrigin: string): Promise<Cached> {
  const url = resolveOpenApiSpecUrl(backendOrigin);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAPI fetch ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as unknown;
  const { digest, getPaths } = buildDigest(json, 14_000);
  return { digest, getPaths, fetchedAt: Date.now() };
}

export async function getOpenApiCatalog(backendOrigin: string): Promise<Cached> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_MS) return cache;

  if (!inflight) {
    inflight = fetchCatalog(backendOrigin)
      .then((c) => {
        cache = c;
        inflight = null;
        return c;
      })
      .catch((e) => {
        inflight = null;
        throw e;
      });
  }
  return inflight;
}

export async function getOpenApiCatalogSafe(backendOrigin: string): Promise<Cached> {
  try {
    return await getOpenApiCatalog(backendOrigin);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      digest: `Could not load OpenAPI spec (${msg}). Answer from programme_snapshot only unless the user retries later.`,
      getPaths: [],
      fetchedAt: Date.now(),
    };
  }
}

export function normalizeApiPath(path: string): string {
  return normalizePath(path);
}
