import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, User, Sparkles, RefreshCw, Zap } from "lucide-react";
import { AmyIcon } from "@/components/amy-icon";
import { useToast } from "@/hooks/use-toast";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useSubscription } from "@/hooks/use-subscription";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "My child won't eat vegetables — what can I do?",
  "How do I establish a better bedtime routine?",
  "My 7-year-old is having tantrums — is this normal?",
  "How can I encourage my child to read more?",
  "What screen time is appropriate for a 5-year-old?",
  "My child is anxious about going to school — how do I help?",
];

export default function AssistantPage() {
  const { toast } = useToast();
  const authFetch = useAuthFetch();
  const { entitlements, isPremium, refresh: refreshSubscription } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Server-driven gating — no local quota counter. Premium users have no limit.
  const dailyLimit = entitlements?.limits.aiQueriesPerDay ?? 5;
  const questionsUsed = entitlements?.usage.aiQueriesToday ?? 0;
  const remainingRaw = entitlements?.usage.aiQueriesRemaining; // null for premium
  const remaining = isPremium ? Infinity : Math.max(0, remainingRaw ?? dailyLimit);
  const limitReached = !isPremium && remaining <= 0;

  const sendMessage = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { default: i18nInstance } = await import("@/i18n");
      const res = await authFetch("/api/ai/assistant-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language: i18nInstance.language || "en" }),
      });
      if (res.status === 402) {
        refreshSubscription();
        // Dispatched event is handled by SubscriptionEventBridge in App.tsx
        window.dispatchEvent(new CustomEvent("amynest:open-paywall", { detail: { reason: "ai_quota" } }));
        return;
      }
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.answer };
      setMessages((prev) => [...prev, assistantMsg]);
      window.dispatchEvent(new CustomEvent("amynest:refresh-subscription"));
    } catch {
      toast({ title: "Failed to get a response. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="font-quicksand text-3xl font-bold text-foreground flex items-center gap-2">
            <AmyIcon size={38} bounce ring />
            Amy AI Assistant
            <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold border-0 ml-1">
              <Zap className="h-3 w-3 mr-1" />
              Amy AI
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">Hi 😊 I'm Amy — ask me anything about parenting, I'm here to help ❤️</p>
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="rounded-full gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Daily limit bar */}
      <div className={`flex-shrink-0 mb-3 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 border text-sm ${
        limitReached
          ? "bg-rose-50 border-rose-200 text-rose-700"
          : remaining <= 2
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-primary/5 border-primary/20 text-primary/80"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          {limitReached ? (
            <span className="font-bold">Daily limit reached — try again tomorrow.</span>
          ) : (
            <span>
              <strong>{remaining}</strong> of {dailyLimit} Amy AI questions remaining today
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: dailyLimit }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < questionsUsed ? "bg-current opacity-80" : "bg-current opacity-20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
            <AmyIcon size={96} bounce ring />
            <div>
              <h2 className="font-quicksand text-xl font-bold text-foreground mb-1">Hi 😊 I'm Amy, your parenting co-pilot</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Don't worry, I'm here to help ❤️ Ask me about sleep, food, behavior, school anxiety, screen time — anything.
              </p>
            </div>

            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Popular Questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={limitReached}
                    className="text-left text-sm p-3 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-foreground/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {limitReached && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700 max-w-sm text-center">
                <p className="font-bold mb-1">Daily limit reached</p>
                <p>You've used all {dailyLimit} Amy AI questions for today. Your limit resets at midnight — come back tomorrow!</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  msg.role !== "assistant" ? "bg-secondary/20 text-secondary-foreground" : ""
                }`}>
                  {msg.role === "assistant" ? <AmyIcon size={36} ring /> : <User className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <Card className={`rounded-2xl shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-primary rounded-tr-sm"
                      : "bg-card border-border rounded-tl-sm"
                  }`}>
                    <CardContent className="p-3.5">
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user" ? "text-primary-foreground" : "text-foreground"
                      }`}>
                        {msg.content}
                      </p>
                    </CardContent>
                  </Card>
                  {msg.role === "assistant" && (
                    <Badge variant="outline" className="text-xs text-muted-foreground border-none px-0 h-auto">
                      Amy AI · always consult a professional for medical concerns
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="shrink-0">
                  <AmyIcon size={36} bounce ring />
                </div>
                <Card className="rounded-2xl rounded-tl-sm border-border shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Amy is thinking…
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-border/50">
        {limitReached ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-rose-700">
            <p className="font-bold text-sm mb-0.5">Daily limit reached</p>
            <p className="text-xs">Your {dailyLimit} Amy AI questions for today are used up. Resets at midnight.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 items-end bg-card rounded-2xl border border-border p-3 shadow-sm focus-within:border-primary transition-colors">
              <Textarea
                ref={textareaRef}
                placeholder="Ask about sleep, tantrums, food, school anxiety..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 min-h-[40px] max-h-[120px] bg-transparent p-0 text-sm placeholder:text-muted-foreground"
                rows={1}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || limitReached}
                size="icon"
                className="rounded-xl h-9 w-9 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </>
        )}
      </div>
    </div>
  );
}
