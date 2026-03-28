import { NextRequest, NextResponse } from "next/server";
import {
  ensureAuthorized,
  estimateTokenCount,
  generateId,
  getOpenAIBaseUrl,
  getOpenAIHeaders,
  normalizeMessages,
  toPlainText,
} from "@/lib/openaiProxy";

export const dynamic = "force-dynamic";

function buildMessagesFromInput(input: unknown) {
  if (typeof input === "string") {
    return [{ role: "user" as const, content: input }];
  }
  if (Array.isArray(input)) {
    const normalized = normalizeMessages(input);
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return [];
}

export async function POST(req: NextRequest) {
  if (!ensureAuthorized(req)) {
    return NextResponse.json(
      { error: { message: "Invalid API Key" } },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON payload" } },
      { status: 400 }
    );
  }

  const fromInput = buildMessagesFromInput(payload.input);
  const fromMessages = normalizeMessages(payload.messages);
  const messages = fromInput.length ? fromInput : fromMessages;

  if (!messages.length) {
    return NextResponse.json(
      { error: { message: "input field is required" } },
      { status: 400 }
    );
  }

  const instructions = typeof payload.instructions === "string" ? payload.instructions.trim() : "";
  const finalMessages = instructions
    ? [{ role: "system" as const, content: instructions }, ...messages]
    : messages;

  const model =
    typeof payload.model === "string" && payload.model.trim()
      ? payload.model.trim()
      : process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const requestBody: Record<string, unknown> = {
      model,
      messages: finalMessages,
      temperature:
        typeof payload.temperature === "number"
          ? payload.temperature
          : Number(process.env.OPENAI_TEMPERATURE || 0.3),
      max_tokens:
        typeof payload.max_output_tokens === "number"
          ? payload.max_output_tokens
          : Number(process.env.OPENAI_MAX_TOKENS || 350),
      stream: false,
    };

    if (Array.isArray(payload.tools)) {
      requestBody.tools = payload.tools;
    }

    if (typeof payload.tool_choice !== "undefined") {
      requestBody.tool_choice = payload.tool_choice;
    }

    const response = await fetch(`${getOpenAIBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: getOpenAIHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: { message: `Upstream OpenAI error: ${response.status} ${text}` } },
        { status: 502 }
      );
    }

    const upstream = (await response.json()) as Record<string, any>;
    const choice = upstream.choices?.[0] || {};
    const assistant = choice.message || {};
    const content = toPlainText(assistant.content);
    const hasToolCalls = Array.isArray(assistant.tool_calls) && assistant.tool_calls.length > 0;

    const promptText = finalMessages.map((m) => m.content).join("\n");
    const promptTokens = estimateTokenCount(promptText);
    const completionTokens = estimateTokenCount(content);

    const output = hasToolCalls
      ? assistant.tool_calls.map((tc: any) => ({
          type: "function_call",
          id: tc.id,
          call_id: tc.id,
          name: tc.function?.name || "unknown",
          arguments: tc.function?.arguments || "{}",
          status: "completed",
        }))
      : [
          {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: content }],
          },
        ];

    return NextResponse.json({
      id: typeof upstream.id === "string" ? upstream.id.replace(/^chatcmpl-/, "resp-") : generateId("resp"),
      object: "response",
      created_at: typeof upstream.created === "number" ? upstream.created : Math.floor(Date.now() / 1000),
      model,
      status: "completed",
      output,
      usage: {
        input_tokens: upstream.usage?.prompt_tokens ?? promptTokens,
        output_tokens: upstream.usage?.completion_tokens ?? completionTokens,
        total_tokens: upstream.usage?.total_tokens ?? promptTokens + completionTokens,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Internal error" } },
      { status: 500 }
    );
  }
}
