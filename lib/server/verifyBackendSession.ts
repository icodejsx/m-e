/**
 * Validates the browser JWT against the real API by fetching the user profile.
 * Used server-side only (e.g. Route Handlers on Vercel).
 */
export async function verifyBackendSession(
  authorizationHeader: string | null,
  userIdHeader: string | null,
): Promise<boolean> {
  if (!authorizationHeader?.startsWith("Bearer ")) return false;
  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) return false;

  const rawId = userIdHeader?.trim();
  const userId = rawId ? Number(rawId) : NaN;
  if (!Number.isFinite(userId) || userId <= 0) return false;

  const backend =
    process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") ??
    "https://app-service.icadpays.com";

  const url = `${backend}/api/Users/${userId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return res.ok;
}

export function aiAnalyticsAuthRequired(): boolean {
  if (process.env.AI_ANALYTICS_REQUIRE_AUTH === "false") return false;
  if (process.env.AI_ANALYTICS_REQUIRE_AUTH === "true") return true;
  return process.env.NODE_ENV === "production";
}
