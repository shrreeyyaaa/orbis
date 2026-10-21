"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cloud, Sparkles, X, Send, Info, ShieldCheck } from "lucide-react";
import type { ChatMessage } from "@/lib/assistant";

export const OPEN_ASSISTANT_EVENT = "orbis:open-assistant";

const SUGGESTIONS = [
  "How's my asset allocation?",
  "Am I saving enough?",
  "Where am I concentrated?",
  "How are my goals tracking?",
  "What should I improve?",
];

export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMode, setResponseMode] = useState<"local" | "cloud">("local");
  const [provider, setProvider] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, allowCloud: true }),
      });
      const json = await res.json();
      setResponseMode(json.mode === "cloud" ? "cloud" : "local");
      setProvider(typeof json.provider === "string" ? json.provider : null);
      setMessages((m) => [...m, { role: "assistant", content: json.reply ?? json.error ?? "Something went wrong." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach the server. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-orbis-title"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex h-14 items-center gap-2 border-b px-4">
              <div className="rounded-lg bg-gold/15 p-1.5 text-gold">
                <Sparkles className="h-4 w-4" />
              </div>
              <span id="ask-orbis-title" className="font-serif text-lg font-semibold">Ask Orbis</span>
              <span className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${responseMode === "cloud" ? "bg-sky-500/10 text-sky-600 dark:text-sky-300" : "bg-primary/10 text-primary"}`}>
                {responseMode === "cloud" ? <Cloud className="h-3 w-3" aria-hidden /> : <ShieldCheck className="h-3 w-3" aria-hidden />}
                {responseMode === "cloud" ? provider ?? "Cloud" : "Local"}
              </span>
              <Button aria-label="Close Ask Orbis" title="Close" variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div ref={scrollRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-lg bg-accent/60 p-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    Ask Orbis uses a cloud AI provider: your household figures and this conversation are sent to it to answer your questions. Answers are informational only, not financial advice.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                    Thinking&hellip;
                  </div>
                </div>
              )}
            </div>

            <form
              className="flex items-center gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <Input
                aria-label="Message Ask Orbis"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances…"
                maxLength={2_000}
                disabled={loading}
              />
              <Button aria-label="Send message" title="Send message" type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
