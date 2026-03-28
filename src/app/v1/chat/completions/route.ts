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

  const messages = normalizeMessages(payload.messages);
  if (!messages.length) {
    return NextResponse.json(
      { error: { message: "messages field is required" } },
      { status: 400 }
    );
  }

  const model =
    typeof payload.model === "string" && payload.model.trim()
      ? payload.model.trim()
      : process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const requestBody: Record<string, unknown> = {
      model,
      messages,
      temperature:
        typeof payload.temperature === "number"
          ? payload.temperature
          : Number(process.env.OPENAI_TEMPERATURE || 0.3),
      max_tokens:
        typeof payload.max_tokens === "number"
          ? payload.max_tokens
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

    const promptText = messages.map((m) => m.content).join("\n");
    const promptTokens = estimateTokenCount(promptText);
    const completionTokens = estimateTokenCount(content);

    const message: Record<string, unknown> = {
      role: "assistant",
      content: content || null,
    };

    if (Array.isArray(assistant.tool_calls) && assistant.tool_calls.length > 0) {
      message.tool_calls = assistant.tool_calls;
    }

    const finishReason = Array.isArray(assistant.tool_calls) && assistant.tool_calls.length > 0
      ? "tool_calls"
      : (choice.finish_reason || "stop");

    return NextResponse.json({
      id: typeof upstream.id === "string" ? upstream.id : generateId("chatcmpl"),
      object: "chat.completion",
      created: typeof upstream.created === "number" ? upstream.created : Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message,
          finish_reason: finishReason,
        },
      ],
      usage: {
        prompt_tokens: upstream.usage?.prompt_tokens ?? promptTokens,
        completion_tokens: upstream.usage?.completion_tokens ?? completionTokens,
        total_tokens:
          upstream.usage?.total_tokens ?? promptTokens + completionTokens,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Internal error" } },
      { status: 500 }
    );
  }
}
