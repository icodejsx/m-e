import {
  matchOpenApiTemplate,
  normalizeApiPath,
} from "@/lib/server/openApiCatalog";

const MAX_TOOL_CHARS = 36_000;

function coerceQuery(q: unknown): Record<string, string> {
  if (!q || typeof q !== "object" || Array.isArray(q)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(q as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") continue;
    out[String(k)] = String(v);
  }
  return out;
}

/**
 * Executes a GET against the real backend; path must match an OpenAPI GET template.
 */
export async function executeBackendApiGet(args: unknown, ctx: {
  backendOrigin: string;
  authorizationHeader: string | null;
  getTemplates: readonly string[];
}): Promise<string> {
  if (!ctx.authorizationHeader?.startsWith("Bearer ")) {
    return JSON.stringify({
      error:
        "No Bearer token on this request. The user must be signed in so the assistant can call the API.",
    });
  }

  if (!ctx.getTemplates.length) {
    return JSON.stringify({
      error:
        "API catalog has no GET routes loaded; cannot proxy. Check OPENAPI_SPEC_URL / BACKEND_ORIGIN.",
    });
  }

  const obj = args && typeof args === "object" ? (args as Record<string, unknown>) : {};
  const rawPath = typeof obj.path === "string" ? obj.path : "";
  const query = coerceQuery(obj.query);

  let normalized: string;
  try {
    normalized = normalizeApiPath(rawPath);
  } catch {
    return JSON.stringify({ error: "Invalid path characters." });
  }

  if (!normalized.startsWith("/api/")) {
    return JSON.stringify({
      error: `Path must start with /api/ — got ${normalized}`,
    });
  }

  const template = matchOpenApiTemplate(normalized, ctx.getTemplates);
  if (!template) {
    return JSON.stringify({
      error: `GET path not allowed or undocumented: ${normalized}`,
      hint: "Pick a GET route listed in the api_catalog section of the system prompt.",
    });
  }

  const origin = ctx.backendOrigin.replace(/\/+$/, "");
  const qs = new URLSearchParams(query).toString();
  const url = `${origin}${normalized}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: ctx.authorizationHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { _nonJson: text.slice(0, 8000) };
  }

  const payload = {
    ok: res.ok,
    status: res.status,
    path: normalized,
    template,
    body: parsed,
  };

  let out = JSON.stringify(payload);
  if (out.length > MAX_TOOL_CHARS) {
    out = JSON.stringify({
      ok: res.ok,
      status: res.status,
      path: normalized,
      template,
      truncated: true,
      note: `JSON response exceeded ${MAX_TOOL_CHARS} chars`,
      bodyPreview: text.slice(0, MAX_TOOL_CHARS),
    });
  }

  return out;
}
