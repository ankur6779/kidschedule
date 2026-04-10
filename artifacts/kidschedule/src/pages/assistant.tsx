import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, User, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.answer };
      setMessages((prev) => [...prev, assistantMsg]);
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
            <Bot className="h-7 w-7 text-primary" />
            AI Parenting Assistant
          </h1>
          <p className="text-muted-foreground mt-1">Ask anything about parenting — get warm, practical advice.</p>
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="rounded-full gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
            <div className="bg-primary/10 text-primary w-20 h-20 rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10" />
            </div>
            <div>
              <h2 className="font-quicksand text-xl font-bold text-foreground mb-1">Your Parenting Co-pilot</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Ask about sleep, food, behavior, school anxiety, screen time, or any parenting challenge.
              </p>
            </div>

            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Popular Questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left text-sm p-3 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-foreground/80 font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === "assistant"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/20 text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
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
                      AmyNest AI · always consult a professional for medical concerns
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="rounded-2xl rounded-tl-sm border-border shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
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
            disabled={!input.trim() || loading}
            size="icon"
            className="rounded-xl h-9 w-9 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
