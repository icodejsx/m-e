import { NextResponse } from "next/server";
import {
  aiAnalyticsAuthRequired,
  verifyBackendSession,
} from "@/lib/server/verifyBackendSession";
import {
  AI_ANALYTICS_MODEL,
  runAiAnalyticsAgent,
} from "@/lib/server/aiAnalyticsAgent";

export const runtime = "nodejs";

const USER_ID_HEADER = "x-me-user-id";

const MAX_BODY_CHARS = 180_000;

type ChatRole = "user" | "assistant";

interface IncomingBody {
  snapshot?: unknown;
  messages?: { role: ChatRole; content: string }[];
}

function isChatMessage(x: unknown): x is { role: ChatRole; content: string } {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.length > 0 &&
    m.content.length < 32_000
  );
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      {
        error:
          "Server is missing OPENAI_API_KEY. Add it to .env.local (or Vercel env) and restart.",
      },
      { status: 503 },
    );
  }

  if (aiAnalyticsAuthRequired()) {
    const ok = await verifyBackendSession(
      req.headers.get("authorization"),
      req.headers.get(USER_ID_HEADER),
    );
    if (!ok) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Sign in again, or ensure BACKEND_ORIGIN on Vercel matches your API.",
        },
        { status: 401 },
      );
    }
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let body: IncomingBody;
  try {
    body = JSON.parse(raw) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.snapshot || typeof body.snapshot !== "object") {
    return NextResponse.json({ error: "Missing snapshot" }, { status: 400 });
  }

  const msgs = Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : [];
  if (msgs.length === 0 || msgs[msgs.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "messages must end with a user turn" },
      { status: 400 },
    );
  }
  const trimmedHistory = msgs.slice(-24);

  const backendOrigin =
    process.env.BACKEND_ORIGIN?.replace(/\/+$/, "") ??
    "https://app-service.icadpays.com";

  try {
    const { reply } = await runAiAnalyticsAgent({
      apiKey,
      backendOrigin,
      authorizationHeader: req.headers.get("authorization"),
      snapshot: body.snapshot,
      messages: trimmedHistory,
    });

    return NextResponse.json({ reply, model: AI_ANALYTICS_MODEL });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Agent failed";
    return NextResponse.json(
      { error: msg.slice(0, 800) },
      { status: 502 },
    );
  }
}
