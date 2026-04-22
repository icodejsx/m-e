/**
 * Base URL the browser uses to talk to the backend.
 *
 * - In the browser we default to the same-origin path `/be-api`, which is
 *   proxied to the real API by a Next.js `rewrites()` rule. This avoids CORS
 *   since the browser never contacts the backend directly.
 * - On the server (SSR, build scripts) we need an absolute URL, so we fall
 *   back to the public backend URL.
 *
 * Override with `NEXT_PUBLIC_API_BASE_URL` to point at another environment.
 */
const DEFAULT_BROWSER_BASE = "/be-api";
const DEFAULT_SERVER_BASE = "https://app-service.icadpays.com/api";

function resolveBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return DEFAULT_BROWSER_BASE;
  return DEFAULT_SERVER_BASE;
}

export const API_BASE_URL = resolveBaseUrl();

export const AUTH_TOKEN_KEY = "me-platform/auth-token";
export const AUTH_USER_KEY = "me-platform/auth-user";
