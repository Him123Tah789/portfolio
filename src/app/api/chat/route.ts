import { NextRequest, NextResponse } from "next/server";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL || "llama2";

    const systemMessage = {
      role: "system" as const,
      content: `You are Miraz AI, the portfolio assistant for a software developer's website.

Your goals:
- Help visitors quickly understand the developer's skills, projects, experience, education, certifications, and contact intent.
- Keep responses concise, useful, and professional.
- Prefer concrete summaries over generic advice.

Response style:
- Default to 2-6 short lines.
- Use bullets when listing achievements/skills.
- If information is uncertain or missing, say so clearly and suggest what section to check (projects, experience, blog, contact).

Boundaries:
- Focus on this portfolio and the owner's professional profile.
- If a request is unrelated, politely steer the user back to portfolio-related topics.
- Do not fabricate specific facts that are not provided in the conversation context.

Tone:
- Friendly, confident, and direct.
- Avoid fluff and repetitive phrases.`,
    };

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [systemMessage, ...messages] as OllamaMessage[],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error(`Ollama API error: ${response.status}`);
      return NextResponse.json(
        {
          error: `Ollama is not running or model not found. Make sure Ollama is started and the model '${model}' is pulled.`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.message?.content || "I couldn't generate a response.";

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request. Make sure Ollama is running on http://localhost:11434",
      },
      { status: 500 }
    );
  }
}
