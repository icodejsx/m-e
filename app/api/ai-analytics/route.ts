import { NextResponse } from "next/server";
import {
  aiAnalyticsAuthRequired,
  verifyBackendSession,
} from "@/lib/server/verifyBackendSession";

export const runtime = "nodejs";

const USER_ID_HEADER = "x-me-user-id";

const MAX_BODY_CHARS = 180_000;
const MODEL = "gpt-4o-mini";

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

  const snapshotJson = JSON.stringify(body.snapshot);

  const system = `You are an analytics copilot for a Monitoring & Evaluation (M&E) web application.

You will receive a JSON snapshot called programme_snapshot. It aggregates MDAs (organizations), projects, budgets, funding allocations, reports in the active reporting period, targets, and progress.

Rules:
- Ground every quantitative claim in programme_snapshot. If something is not in the snapshot, say you do not have that data.
- Prefer short sections with markdown headings (##) and bullet lists.
- Call out risks: reporting backlog, under-funded projects vs budget, uneven submissions across MDAs, targets lagging.
- Use plain language suitable for programme managers.

programme_snapshot JSON:
${snapshotJson}`;

  const openaiMessages: { role: "system" | ChatRole; content: string }[] = [
    { role: "system", content: system },
    ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: openaiMessages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return NextResponse.json(
      {
        error: "OpenAI request failed",
        detail: errText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Empty model response" }, { status: 502 });
  }

  return NextResponse.json({ reply: content, model: MODEL });
}
