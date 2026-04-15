"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function FindMyVibeDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me what you're trying to build or automate, and I'll find the right tool for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message ?? "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger button — indigo, glow on hover */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full transition-all duration-150 hover:bg-[#4F46E5] hover:shadow-glow active:scale-[0.97]"
        style={{
          width: "3.25rem",
          height: "3.25rem",
          background: "#6366F1",
          boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
        }}
        aria-label="Find a product — AI assistant"
      >
        <Search className="h-5 w-5 text-white" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed bottom-0 right-0 z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          height: "min(560px, 90vh)",
          background: "#0A0A0A",
          borderTop: "1px solid rgba(99,102,241,0.20)",
          borderLeft: "1px solid rgba(99,102,241,0.20)",
          borderRadius: "12px 0 0 0",
          boxShadow: "0 -8px 48px rgba(99,102,241,0.10), -2px 0 16px rgba(0,0,0,0.4)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.26s cubic-bezier(0.32,0,0.67,0)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.30)",
              }}
            >
              <Search className="h-3.5 w-3.5" style={{ color: "#6366F1" }} />
            </div>
            <div>
              <p className="text-[12px] font-semibold font-headline text-white">
                Find My Vibe
              </p>
              <p className="text-[10px] font-mono" style={{ color: "#3F3F46" }}>
                Product assistant
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="transition-colors duration-150 hover:text-white"
            style={{ color: "#3F3F46" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[82%] rounded-xl px-4 py-2.5 text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: "#6366F1",
                        color: "#FFFFFF",
                      }
                    : {
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#A1A1AA",
                      }
                }
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(
                        /\*\*\[(.+?)\]\((.+?)\)\*\*/g,
                        '<a href="$2" style="color:#818CF8;text-decoration:underline;text-underline-offset:2px" target="_blank">$1</a>',
                      )
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#6366F1" }} />
                <span className="text-[11px] font-mono" style={{ color: "#71717A" }}>Finding…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-2.5"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="e.g. I need a Notion automation…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#3F3F46] outline-none font-mono"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 disabled:opacity-30 active:scale-[0.96]"
              style={{ background: "#6366F1" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#4F46E5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#6366F1")}
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
