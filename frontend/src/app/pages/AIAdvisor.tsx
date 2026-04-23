import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendAdvisorMessage } from "../lib/api/aiAdvisor";
import { AnimatePresence, motion } from "motion/react";
import { useLocale } from "../lib/locale";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  technicalAnalysis?: string | null;
  fundamentalAnalysis?: string | null;
  investmentAnalysis?: string | null;
};

type ExpandState = Record<
  string,
  {
    technical: boolean;
    fundamental: boolean;
  }
>;

const markdownComponents = {
  h1: ({ children }: any) => <h1 className="mb-3 mt-5 break-words text-2xl font-bold text-foreground">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-3 mt-5 break-words text-xl font-bold text-foreground">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 mt-4 break-words text-lg font-bold text-foreground">{children}</h3>,
  p: ({ children }: any) => <p className="my-2 break-words text-sm leading-7 text-foreground/95">{children}</p>,
  ul: ({ children }: any) => <ul className="my-3 list-disc space-y-2 pl-5 text-foreground/95">{children}</ul>,
  li: ({ children }: any) => <li className="break-words text-sm leading-7">{children}</li>,
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ReportSection({ title, content, isOpen, onToggle }: any) {
  if (!content || !content.trim()) return null;
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-muted/35">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/80">
        <span className="min-w-0 break-words text-sm font-medium text-foreground">{title}</span>
        {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {isOpen && <div className="overflow-hidden border-t border-border/70 px-4 py-3"><MarkdownBlock content={content} /></div>}
    </div>
  );
}

function InlineReportSection({ title, content }: any) {
  if (!content || !content.trim()) return null;
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-muted/35">
      <div className="border-b border-border/70 px-4 py-3 text-left">
        <span className="block break-words text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="overflow-hidden px-4 py-3"><MarkdownBlock content={content} /></div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-1 align-middle" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span key={index} className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 dark:bg-emerald-300/95" style={{ animationDuration: "0.9s", animationDelay: `${index * 0.14}s` }} />
      ))}
    </span>
  );
}

export function AIAdvisor() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t("ai.greeting"),
      technicalAnalysis: null,
      fundamentalAnalysis: null,
      investmentAnalysis: null,
    },
  ]);

  const [expanded, setExpanded] = useState<ExpandState>({});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const toggleSection = (messageId: string, section: "technical" | "fundamental") => {
    setExpanded((prev) => ({
      ...prev,
      [messageId]: {
        technical: prev[messageId]?.technical ?? false,
        fundamental: prev[messageId]?.fundamental ?? false,
        [section]: !(prev[messageId]?.[section] ?? false),
      },
    }));
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setIsSending(true);
      const formattedMessage = `Luôn trả lời bằng tiếng Việt. Trả lời bằng markdown. Phần đầu là "### Trả lời trọng tâm". \n\nCâu hỏi: ${question}`;
      const result = await sendAdvisorMessage({ message: formattedMessage });
      const assistantId = `${Date.now()}-assistant`;

      setMessages((prev) => [...prev, {
        id: assistantId,
        role: "assistant",
        content: result.reply || "### " + t("ai.mainReply"),
        technicalAnalysis: result.technical_analysis,
        fundamentalAnalysis: result.fundamental_analysis,
        investmentAnalysis: result.investment_analysis,
      }]);
      setExpanded((prev) => ({ ...prev, [assistantId]: { technical: false, fundamental: false } }));
    } catch (error) {
      toast.error(t("ai.error"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md overflow-x-hidden pb-24 font-sans">
      <div className="mt-3 px-4 text-left">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-10 rounded-xl border-border/80 bg-card/90 px-3 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("ai.exit")}
        </Button>
      </div>

      <div className="mt-3 space-y-4 px-4 text-left">
        {messages.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 max-w-full">
            <Card className={`p-4 border ${m.role === "user" ? "border-cyan-500/35 bg-cyan-500/8" : "border-border/80 bg-card/95"}`}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {m.role === "user" ? <User className="h-4 w-4 text-cyan-600" /> : <Bot className="h-4 w-4 text-emerald-600" />}
                  <p className="text-xs text-muted-foreground">{m.role === "user" ? t("ai.user") : t("ai.advisor")}</p>
                </div>
                {m.role === "assistant" ? (
                  <div className="space-y-3">
                    <MarkdownBlock content={m.content} />
                    <InlineReportSection title={t("ai.investment")} content={m.investmentAnalysis} />
                    <ReportSection title={t("ai.technical")} content={m.technicalAnalysis} isOpen={expanded[m.id]?.technical} onToggle={() => toggleSection(m.id, "technical")} />
                    <ReportSection title={t("ai.fundamental")} content={m.fundamentalAnalysis} isOpen={expanded[m.id]?.fundamental} onToggle={() => toggleSection(m.id, "fundamental")} />
                  </div>
                ) : <div className="text-sm leading-6">{m.content}</div>}
              </div>
            </Card>
          </motion.div>
        ))}

        {isSending && (
          <div className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 ml-4">
            <span className="animate-pulse">{t("ai.processing")}</span>
            <LoadingDots />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Input placeholder={t("ai.placeholder")} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} disabled={isSending} className="bg-card" />
          <Button onClick={handleSend} disabled={isSending || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
