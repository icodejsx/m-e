import { getOpenApiCatalogSafe } from "@/lib/server/openApiCatalog";
import { executeBackendApiGet } from "@/lib/server/backendApiTool";

export const AI_ANALYTICS_MODEL = "gpt-4o-mini";

const MAX_TOOL_ROUNDS = 10;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "backend_api_get",
      description:
        "Read-only GET to the deployed M&E JSON API (same routes as Swagger). Use when the user needs live server data: MDAs, LGAs, units, projects, funding, reports, targets, users, etc. Pass query params the API expects (e.g. Page, PageSize as strings).",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              'Must match a documented GET path, e.g. "/api/projects", "/api/mdas", "/api/reports".',
          },
          query: {
            type: "object",
            additionalProperties: { type: "string" },
            description:
              "Optional query parameters as string key/value pairs (e.g. Page, PageSize).",
          },
        },
        required: ["path"],
      },
    },
  },
];

type ChatTurn = { role: "user" | "assistant"; content: string };

type OpenAiMessage = Record<string, unknown>;

export async function runAiAnalyticsAgent(opts: {
  apiKey: string;
  backendOrigin: string;
  authorizationHeader: string | null;
  snapshot: unknown;
  messages: ChatTurn[];
}): Promise<{ reply: string }> {
  const catalog = await getOpenApiCatalogSafe(opts.backendOrigin);

  const systemText = `You are an analytics copilot for a Monitoring & Evaluation (M&E) platform.

You combine TWO sources:
1) **programme_snapshot** — JSON aggregated from the user's in-browser workspace (local totals / charts).
2) **Live backend API** — call the tool \`backend_api_get\` with paths from the OpenAPI catalog below. Requests run as the signed-in user (their JWT).

Rules:
- Use **backend_api_get** for authoritative lists and counts from the server (MDAs, LGAs, projects, reports, funding, etc.).
- Use **programme_snapshot** when it clearly matches the question or when the API is unavailable.
- Say where figures came from ("API response" vs "workspace snapshot").
- If the tool errors, explain briefly and try another GET path or pagination (Page, PageSize).
- Prefer markdown with ## headings and bullet lists.

Swagger UI (human-readable docs): ${opts.backendOrigin.replace(/\/+$/, "")}/swagger/index.html

### api_catalog (documented GET routes)

${catalog.digest}

### programme_snapshot (browser aggregate)

${JSON.stringify(opts.snapshot)}
`;

  const openaiMessages: OpenAiMessage[] = [
    { role: "system", content: systemText },
    ...opts.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_ANALYTICS_MODEL,
        temperature: 0.35,
        messages: openaiMessages,
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 600)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: {
          role?: string;
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            type?: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error("Empty choice from OpenAI");

    const toolCalls = msg.tool_calls;
    if (toolCalls?.length) {
      openaiMessages.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments ?? "{}",
          },
        })),
      });

      for (const tc of toolCalls) {
        let args: unknown = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          args = { parseError: true };
        }

        const toolContent =
          tc.function.name === "backend_api_get"
            ? await executeBackendApiGet(args, {
                backendOrigin: opts.backendOrigin,
                authorizationHeader: opts.authorizationHeader,
                getTemplates: catalog.getPaths,
              })
            : JSON.stringify({ error: `Unknown tool: ${tc.function.name}` });

        openaiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolContent,
        });
      }
      continue;
    }

    const content = typeof msg.content === "string" ? msg.content.trim() : "";
    if (!content) throw new Error("Model returned empty content");
    return { reply: content };
  }

  throw new Error("Too many tool rounds — try a narrower question.");
}
