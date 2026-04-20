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
  h1: ({ children }: any) => (
    <h1 className="mb-3 mt-5 break-words text-2xl font-bold text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="mb-3 mt-5 break-words text-xl font-bold text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mb-2 mt-4 break-words text-lg font-bold text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="mb-2 mt-4 break-words text-base font-semibold text-foreground">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="my-2 break-words text-sm leading-7 text-foreground/95">
      {children}
    </p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-foreground">{children}</em>
  ),
  ul: ({ children }: any) => (
    <ul className="my-3 list-disc space-y-2 pl-5 text-foreground/95">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-3 list-decimal space-y-2 pl-5 text-foreground/95">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="break-words text-sm leading-7">{children}</li>
  ),
  hr: () => <hr className="my-5 border-border/80" />,
  blockquote: ({ children }: any) => (
    <blockquote className="my-4 overflow-hidden rounded-r-lg border-l-4 border-emerald-500/60 bg-muted/55 px-4 py-3 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code({ inline, children }: any) {
    if (inline) {
      return (
        <code className="break-all rounded bg-muted px-1.5 py-0.5 text-[13px] text-emerald-700 dark:text-emerald-300">
          {children}
        </code>
      );
    }

    return (
      <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-border/80 bg-muted/45">
        <pre className="min-w-0 p-4">
          <code className="whitespace-pre-wrap break-words text-sm text-emerald-700 dark:text-emerald-300">
            {children}
          </code>
        </pre>
      </div>
    );
  },
  table: ({ children }: any) => (
    <div className="my-5 max-w-full overflow-x-auto">
      <table className="w-full min-w-[520px] rounded-xl border border-border/80 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-muted text-foreground">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="bg-card">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-border/70 last:border-b-0">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 align-top text-foreground/95">{children}</td>
  ),
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ReportSection({
  title,
  content,
  isOpen,
  onToggle,
}: {
  title: string;
  content: string | null | undefined;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (!content || !content.trim()) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-muted/35">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/80"
      >
        <span className="min-w-0 break-words text-sm font-medium text-foreground">
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="overflow-hidden border-t border-border/70 px-4 py-3">
          <MarkdownBlock content={content} />
        </div>
      )}
    </div>
  );
}

function InlineReportSection({
  title,
  content,
}: {
  title: string;
  content: string | null | undefined;
}) {
  if (!content || !content.trim()) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/80 bg-muted/35">
      <div className="border-b border-border/70 px-4 py-3">
        <span className="block break-words text-sm font-medium text-foreground">
          {title}
        </span>
      </div>

      <div className="overflow-hidden px-4 py-3">
        <MarkdownBlock content={content} />
      </div>
    </div>
  );
}

function buildAssistantContent(result: {
  reply?: string | null;
  technical_analysis?: string | null;
  fundamental_analysis?: string | null;
  investment_analysis?: string | null;
}) {
  const reply = result.reply?.trim();

  if (reply) {
    return reply;
  }

  const hasDetailedReport = [
    result.technical_analysis,
    result.fundamental_analysis,
    result.investment_analysis,
  ].some((part) => Boolean(part && part.trim()));

  if (hasDetailedReport) {
    return "### Trả lời trọng tâm";
  }

  return "AI Advisor chưa trả về nội dung phù hợp.";
}

function LoadingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-1 align-middle" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 dark:bg-emerald-300/95"
          style={{
            animationDuration: "0.9s",
            animationDelay: `${index * 0.14}s`,
          }}
        />
      ))}
    </span>
  );
}

export function AIAdvisor() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Xin chào, hãy nhập câu hỏi tài chính của bạn để tôi hỗ trợ.",
      technicalAnalysis: null,
      fundamentalAnalysis: null,
      investmentAnalysis: null,
    },
  ]);

  const [expanded, setExpanded] = useState<ExpandState>({});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const toggleSection = (
    messageId: string,
    section: "technical" | "fundamental",
  ) => {
    setExpanded((prev) => ({
      ...prev,
      [messageId]: {
        technical: prev[messageId]?.technical ?? false,
        fundamental: prev[messageId]?.fundamental ?? false,
        [section]: !(prev[messageId]?.[section] ?? false),
      },
    }));
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setIsSending(true);

      const formattedMessage = `
Trả lời bằng markdown rõ ràng.
Phần đầu là "### Trả lời trọng tâm".
Nếu có thì tách riêng:
- Báo cáo kỹ thuật
- Báo cáo cơ bản
- Tư vấn đầu tư

Câu hỏi:
${question}
      `.trim();

      const result = await sendAdvisorMessage({
        message: formattedMessage,
      });

      const assistantMessageId = `${Date.now()}-assistant`;

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: buildAssistantContent(result),
        technicalAnalysis: result.technical_analysis,
        fundamentalAnalysis: result.fundamental_analysis,
        investmentAnalysis: result.investment_analysis,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setExpanded((prev) => ({
        ...prev,
        [assistantMessageId]: {
          technical: false,
          fundamental: false,
        },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gọi AI Advisor thất bại";

      toast.error(errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content: errorMessage,
          technicalAnalysis: null,
          fundamentalAnalysis: null,
          investmentAnalysis: null,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md overflow-x-hidden pb-24">
      <div className="mt-3 px-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="h-10 rounded-xl border-border/80 bg-card/90 px-3 text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Thoát khỏi AI Advisor
        </Button>
      </div>

      <div className="mt-3 space-y-4 px-4">
        {messages.map((message, index) => {
          const messageExpand = expanded[message.id] ?? {
            technical: false,
            fundamental: false,
          };

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.24,
                delay: Math.min(index * 0.02, 0.12),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="min-w-0 max-w-full"
            >
              <Card
                className={`min-w-0 max-w-full overflow-hidden border p-4 ${
                  message.role === "user"
                    ? "border-cyan-500/35 bg-cyan-500/8"
                    : "border-border/80 bg-card/95"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {message.role === "user" ? (
                      <User className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                    ) : (
                      <Bot className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {message.role === "user" ? "Bạn" : "AI Advisor"}
                    </p>
                  </div>

                  {message.role === "assistant" ? (
                    <div className="w-full space-y-3">
                      <MarkdownBlock content={message.content} />

                      <div className="mx-auto w-full max-w-[calc(100%-8px)] space-y-3">
                        <InlineReportSection
                          title="Tư vấn đầu tư"
                          content={message.investmentAnalysis}
                        />

                        <ReportSection
                          title="Báo cáo kỹ thuật"
                          content={message.technicalAnalysis}
                          isOpen={messageExpand.technical}
                          onToggle={() => toggleSection(message.id, "technical")}
                        />

                        <ReportSection
                          title="Báo cáo cơ bản"
                          content={message.fundamentalAnalysis}
                          isOpen={messageExpand.fundamental}
                          onToggle={() => toggleSection(message.id, "fundamental")}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words pl-0 text-sm leading-6 text-foreground">
                      {message.content}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {isSending && (
            <motion.div
              key="assistant-loading"
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 max-w-full"
            >
              <Card className="min-w-0 max-w-full overflow-hidden border-border/80 bg-card/95 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                    <p className="text-xs text-muted-foreground">AI Advisor</p>
                  </div>

                  <div className="inline-flex max-w-full items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm leading-6 text-emerald-700 dark:text-emerald-200">
                    <span className="animate-pulse">AI đang phân tích</span>
                    <LoadingDots />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 p-4 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nhập câu hỏi tài chính..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="border-border/80 bg-card text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}