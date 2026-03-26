"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "What are your strongest skills?",
  "Tell me about your featured projects",
  "What experience do you have?",
];

const BOT_NAME = "Miraz AI";

export default function ChatBot() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! 👋 I’m Miraz AI. Ask me about skills, projects, experience, education, or how to contact the owner.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendText = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages
            .filter((msg) => msg.role !== "assistant" || msg.id !== "1")
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            }))
            .concat({
              role: "user",
              content: text,
            }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content:
          "Sorry, I hit an error. Please ensure Ollama is running on http://localhost:11434 and your model is available.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!mounted) {
    return null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendText(input);
  };

  const handleComposerKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendText(input);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          boxShadow: "0 14px 30px rgba(108, 99, 255, 0.35)",
        }}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <MessageCircle size={22} />
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-5 z-40 flex h-[560px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border animate-in"
          style={{
            background: "var(--chat-shell-bg)",
            borderColor: "var(--chat-shell-border)",
            boxShadow: "var(--chat-shell-shadow)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div
            className="border-b px-4 py-4"
            style={{
              borderColor: "var(--border)",
              background: "var(--chat-header-bg)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
                  {BOT_NAME}
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Ask about projects, experience, skills, and background
                </p>
              </div>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 12px rgba(108,99,255,0.85)" }}
                aria-hidden
              />
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendText(prompt)}
                    disabled={isLoading}
                    className="rounded-full border px-3 py-1.5 text-xs transition hover:opacity-90 disabled:opacity-50"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "rounded-br-md text-white"
                      : "rounded-bl-md"
                  }`}
                  style={
                    message.role === "user"
                      ? {
                          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                          boxShadow: "0 8px 24px rgba(108, 99, 255, 0.25)",
                        }
                      : {
                          background: "var(--chat-assistant-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }
                  }
                >
                  <p
                    className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color:
                        message.role === "user"
                          ? "rgba(255,255,255,0.78)"
                          : "var(--text-muted)",
                    }}
                  >
                    {message.role === "user" ? "You" : BOT_NAME}
                  </p>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-md px-4 py-2.5"
                  style={{
                    background: "var(--chat-assistant-bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--text-muted)" }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--text-muted)", animationDelay: "120ms" }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--text-muted)", animationDelay: "240ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="border-t p-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Write a message..."
                disabled={isLoading}
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm leading-6 outline-none transition"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--chat-input-bg)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "white",
                }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
