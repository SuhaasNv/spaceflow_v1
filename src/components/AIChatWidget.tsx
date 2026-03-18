import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, ChevronDown, CalendarCheck, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── ColorOrb (rendered via global CSS in index.css) ──────────────────────────
interface OrbProps {
  size?: number;
  baseColor?: string;
  accent1?: string;
  accent2?: string;
  accent3?: string;
  spinDuration?: number;
}

function ColorOrb({
  size = 24,
  baseColor = "hsl(172 66% 20%)",
  accent1 = "hsl(172 66% 55%)",
  accent2 = "hsl(190 60% 50%)",
  accent3 = "hsl(155 60% 45%)",
  spinDuration = 18,
}: OrbProps) {
  const blur = Math.max(size * 0.015, 2);
  const contrast = Math.max(size * 0.008, 1.5);
  return (
    <div
      className="sf-color-orb shrink-0"
      style={{
        width: size,
        height: size,
        "--sf-base": baseColor,
        "--sf-accent1": accent1,
        "--sf-accent2": accent2,
        "--sf-accent3": accent3,
        "--sf-spin-dur": `${spinDuration}s`,
        "--sf-blur": `${blur}px`,
        "--sf-contrast": contrast,
      } as React.CSSProperties}
    />
  );
}

// ── Role-specific premade prompts ─────────────────────────────────────────────
const PREMADE_PROMPTS: Record<string, { label: string; prompt: string }[]> = {
  ADMIN: [
    { label: "Platform health", prompt: "Give me a quick overview of platform health and any concerns." },
    { label: "Active users", prompt: "How many active users do we have and what are their roles?" },
    { label: "Recent activity", prompt: "Summarise the most significant activity in the last 7 days." },
    { label: "Space performance", prompt: "Which spaces are performing best and worst right now?" },
    { label: "Audit highlights", prompt: "Are there any unusual API activity patterns I should know about?" },
  ],
  FACILITIES_MANAGER: [
    { label: "Utilization this week", prompt: "What is our space utilization looking like this week?" },
    { label: "No-show problem", prompt: "Which spaces have the most no-shows and what can we do?" },
    { label: "Cancellation patterns", prompt: "Summarise recent cancellation reasons and their patterns." },
    { label: "Peak hours", prompt: "What are the peak booking hours and days across all spaces?" },
    { label: "Underused spaces", prompt: "Which spaces are consistently underused and should we reconsider them?" },
  ],
  EMPLOYEE: [
    { label: "Book meeting room today", prompt: "Book me a meeting room for today at 2pm for 1 hour." },
    { label: "Book desk tomorrow", prompt: "Book me a hot desk for tomorrow morning." },
    { label: "Book quiet room now", prompt: "Book me a quiet private office for the next hour." },
    { label: "Check-in help", prompt: "How does the check-in process work?" },
    { label: "My upcoming bookings", prompt: "How many upcoming bookings do I have?" },
  ],
};

// ── Premade prompts — employee ones now trigger actual bookings ───────────────
// (already defined above, just update the employee prompts)

// ── Types ─────────────────────────────────────────────────────────────────────
interface BookingConfirmation {
  id: string;
  spaceName: string;
  spaceType: string;
  floor: string | null;
  building: string | null;
  startTime: string;
  endTime: string;
}

interface TokenUsage {
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
  model?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
  provider?: string;
  tokenUsage?: TokenUsage;
  bookingConfirmation?: BookingConfirmation;
}

const WIDGET_W = 380;
const WIDGET_H = 540;

// ── Main widget ───────────────────────────────────────────────────────────────
export function AIChatWidget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "EMPLOYEE";
  const premadePrompts = PREMADE_PROMPTS[role] ?? PREMADE_PROMPTS.EMPLOYEE;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.post<{
        response: string;
        followUpPrompts: string[];
        provider?: string;
        tokenUsage?: TokenUsage;
        bookingConfirmation?: BookingConfirmation;
      }>("/api/ai/chat", { message: text.trim(), history });

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        followUps: data.followUpPrompts,
        provider: data.provider,
        tokenUsage: data.tokenUsage,
        bookingConfirmation: data.bookingConfirmation,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh all booking-related views immediately
      if (data.bookingConfirmation) {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["occupied-spaces"] });

        // Persist booked time so BookSpace can seed its filter to the right window
        try {
          const st = new Date(data.bookingConfirmation.startTime);
          const et = new Date(data.bookingConfirmation.endTime);
          const pad = (n: number) => String(n).padStart(2, "0");
          localStorage.setItem(
            "sf-last-booked-time",
            JSON.stringify({
              date: `${st.getFullYear()}-${pad(st.getMonth() + 1)}-${pad(st.getDate())}`,
              start: `${pad(st.getHours())}:${pad(st.getMinutes())}`,
              end: `${pad(et.getHours())}:${pad(et.getMinutes())}`,
            }),
          );
        } catch {
          // non-critical
        }
      }
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I ran into an issue. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
    if (e.key === "Escape") setOpen(false);
  };

  const roleBadge: Record<string, string> = {
    ADMIN: "Admin",
    FACILITIES_MANAGER: "Facilities Manager",
    EMPLOYEE: "Employee",
  };

  return (
    <div ref={wrapperRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.8 }}
            style={{ width: WIDGET_W, height: WIDGET_H }}
            className="flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/40 shrink-0">
              <ColorOrb size={28} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-display leading-tight">SpaceFlow AI</p>
                <p className="text-[10px] text-muted-foreground">
                  {roleBadge[role]} assistant
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col">
                  {/* Welcome */}
                  <div className="flex flex-col items-center gap-3 pt-4 pb-5">
                    <ColorOrb size={48} spinDuration={12} />
                    <div className="text-center">
                      <p className="font-semibold font-display text-sm">
                        Hi{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                        I'm your AI workspace assistant. Ask me anything or pick a prompt below.
                      </p>
                    </div>
                  </div>

                  {/* Premade prompts */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-0.5">
                      Suggested for you
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {premadePrompts.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => sendMessage(p.prompt)}
                          className="text-left text-sm px-3 py-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all duration-150 group"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary/60 group-hover:text-primary shrink-0 transition-colors" />
                            {p.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex flex-col gap-2 max-w-[88%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                              <ColorOrb size={14} spinDuration={25} />
                              <span className="text-[10px] font-medium">
                                SpaceFlow AI
                                {msg.tokenUsage?.model
                                  ? ` · ${msg.tokenUsage.model}`
                                  : msg.provider
                                  ? ` · ${msg.provider}`
                                  : ""}
                              </span>
                            </div>
                          )}
                          {msg.content}
                        </div>

                        {/* Token usage badge */}
                        {msg.role === "assistant" && msg.tokenUsage?.totalTokens && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 px-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>
                              {msg.tokenUsage.promptTokens != null && `${msg.tokenUsage.promptTokens}↑ `}
                              {msg.tokenUsage.responseTokens != null && `${msg.tokenUsage.responseTokens}↓ `}
                              {msg.tokenUsage.totalTokens} tokens
                            </span>
                          </div>
                        )}

                        {/* Booking confirmation card */}
                        {msg.bookingConfirmation && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2 w-full"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-primary">Booking Confirmed</p>
                                <p className="text-xs font-semibold">{msg.bookingConfirmation.spaceName}</p>
                              </div>
                            </div>
                            <div className="space-y-1 pl-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 shrink-0" />
                                {new Date(msg.bookingConfirmation.startTime).toLocaleString("en-US", {
                                  weekday: "short", month: "short", day: "numeric",
                                  hour: "numeric", minute: "2-digit", hour12: true,
                                })}
                                {" – "}
                                {new Date(msg.bookingConfirmation.endTime).toLocaleTimeString("en-US", {
                                  hour: "numeric", minute: "2-digit", hour12: true,
                                })}
                              </div>
                              {(msg.bookingConfirmation.floor || msg.bookingConfirmation.building) && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {[msg.bookingConfirmation.floor, msg.bookingConfirmation.building]
                                    .filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* AI follow-up prompts */}
                        {msg.role === "assistant" && msg.followUps && msg.followUps.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, i) => (
                              <button
                                key={i}
                                onClick={() => sendMessage(fu)}
                                className="text-xs px-2.5 py-1 rounded-full border border-primary/25 text-primary hover:bg-primary/10 transition-colors"
                              >
                                {fu}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                        <ColorOrb size={14} spinDuration={8} />
                        <motion.div
                          className="flex gap-1"
                          initial="start"
                          animate="end"
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card px-3 pt-3 pb-3 shrink-0">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 focus-within:border-primary/50 focus-within:bg-background transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything… (Enter to send)"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 py-0.5 max-h-[100px] overflow-y-auto"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1.5 px-1">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger pill */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-lg transition-colors ${
          open
            ? "bg-muted border-border text-muted-foreground"
            : "bg-card border-border hover:border-primary/40 text-foreground"
        }`}
      >
        <ColorOrb size={22} />
        <span className="text-sm font-medium select-none">
          {open ? "Close" : "Ask AI"}
        </span>
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="up" initial={{ rotate: 0 }} animate={{ rotate: 180 }} exit={{ rotate: 0 }}>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.div>
          ) : (
            <motion.div key="spark" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
