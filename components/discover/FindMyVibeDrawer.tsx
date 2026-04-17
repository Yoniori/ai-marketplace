"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

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
        "Hey! Tell me what you're trying to build or automate, and I'll find the right tool for you. ✨",
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
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #00e6e6, #9c42f4)",
          boxShadow: "0 0 32px rgba(0,230,230,0.40), 0 4px 20px rgba(0,0,0,0.6)",
        }}
        aria-label="Find My Vibe — AI product assistant"
      >
        <Sparkles className="h-6 w-6 text-[#0e0e10]" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed bottom-0 right-0 z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          height: "min(580px, 90vh)",
          background: "rgba(14,14,16,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,255,255,0.18)",
          borderBottomWidth: 0,
          borderRightWidth: 0,
          borderRadius: "16px 0 0 0",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.32,0,0.67,0)",
          boxShadow: "0 -8px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "rgba(0,255,255,0.12)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #00e6e6, #9c42f4)" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0e0e10]" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-400">
                Find My Vibe
              </p>
              <p className="font-mono text-[9px] text-on-surface-variant/50">
                AI product assistant
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-on-surface-variant/50 hover:text-white transition-colors"
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
                className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(0,230,230,0.18), rgba(156,66,244,0.18))",
                        border: "1px solid rgba(0,255,255,0.20)",
                        color: "#e8e6e8",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(72,71,74,0.35)",
                        color: "#b0adb0",
                      }
                }
              >
                {/* Render basic markdown bold as <strong> */}
                <span
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/"/g, "&quot;")
                      .replace(
                        /\*\*\[(.+?)\]\((.+?)\)\*\*/g,
                        (_, text, url) => {
                          const safe =
                            /^(\/|https?:\/\/|mailto:)/i.test(url) &&
                            !/["<>\s]/.test(url);
                          if (!safe) return text;
                          return `<a href="${url}" style="color:#00e6e6;text-decoration:underline;text-underline-offset:2px" target="_blank" rel="noopener noreferrer">${text}</a>`;
                        },
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
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(72,71,74,0.35)",
                }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400/60" />
                <span className="font-mono text-[11px] text-on-surface-variant/50">
                  Finding…
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "rgba(0,255,255,0.10)" }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{
              background: "rgba(25,25,28,0.80)",
              border: "1px solid rgba(72,71,74,0.50)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="e.g. I need a Notion automation…"
              className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-on-surface-variant/35 outline-none font-body"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg, #00e6e6, #9c42f4)" }}
            >
              <Send className="h-3.5 w-3.5 text-[#0e0e10]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
