import { NextRequest } from "next/server";

export type ProxyMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
};

export function getProxySecretKey() {
  return (process.env.API_SECRET_KEY || "change-secret-key-2026").trim();
}

export function ensureAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const secret = getProxySecretKey();
  const incoming = auth.replace(/^Bearer\s+/i, "").trim();
  return incoming.length > 0 && incoming === secret;
}

export function getOpenAIBaseUrl() {
  const configured = (process.env.OPENAI_BASE_URL || "").trim();
  return (configured || "https://api.openai.com/v1").replace(/\/+$/, "");
}

export function getOpenAIHeaders() {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const apiKeyHeader = (process.env.OPENAI_API_KEY_HEADER || "Authorization").trim();
  const apiKeyPrefix = (process.env.OPENAI_API_KEY_PREFIX || "Bearer").trim();

  return {
    "Content-Type": "application/json",
    [apiKeyHeader]: apiKeyPrefix ? `${apiKeyPrefix} ${apiKey}` : apiKey,
  } as Record<string, string>;
}

export function toPlainText(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          if (typeof rec.text === "string") return rec.text;
          if (typeof rec.content === "string") return rec.content;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function normalizeMessages(input: unknown): ProxyMessage[] {
  if (!Array.isArray(input)) return [];

  const normalized: ProxyMessage[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const role = row.role;
    if (role !== "system" && role !== "user" && role !== "assistant" && role !== "tool") continue;

    const content = toPlainText(row.content);
    normalized.push({
      role,
      content,
      name: typeof row.name === "string" ? row.name : undefined,
      tool_call_id: typeof row.tool_call_id === "string" ? row.tool_call_id : undefined,
    });
  }

  return normalized;
}

export function estimateTokenCount(text: string) {
  if (!text.trim()) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.25);
}

export function generateId(prefix: "chatcmpl" | "resp") {
  const random = Math.random().toString(36).slice(2, 20);
  return `${prefix}-${random}`;
}
