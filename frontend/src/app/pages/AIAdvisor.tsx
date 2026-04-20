import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  ChevronLeft,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendAdvisorMessage } from "../lib/api/aiAdvisor";

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
    investment: boolean;
  }
>;

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold text-slate-100 mt-5 mb-3">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-bold text-slate-100 mt-5 mb-3">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-bold text-slate-100 mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-base font-semibold text-slate-100 mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="text-sm leading-7 text-slate-200 my-2">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-100">{children}</em>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 my-3 space-y-2 text-slate-200">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 my-3 space-y-2 text-slate-200">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm leading-7">{children}</li>
  ),
  hr: () => <hr className="my-5 border-slate-700" />,
  blockquote: ({ children }: any) => (
    <blockquote className="my-4 border-l-4 border-cyan-500/70 bg-slate-950/60 px-4 py-3 text-slate-300 italic rounded-r-lg">
      {children}
    </blockquote>
  ),
  code({ inline, children }: any) {
    if (inline) {
      return (
        <code className="rounded bg-slate-950 px-1.5 py-0.5 text-cyan-300 text-[13px]">
          {children}
        </code>
      );
    }

    return (
      <pre className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
        <code className="text-sm text-cyan-300">{children}</code>
      </pre>
    );
  },
  table: ({ children }: any) => (
    <div className="my-5 overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-xl border border-slate-700 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-800/80 text-slate-100">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="bg-slate-950/40">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-slate-700 last:border-b-0">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 align-top text-slate-200">{children}</td>
  ),
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="max-w-none">
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
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-900/60 transition"
      >
        <span className="text-sm font-medium text-slate-100">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-slate-800 px-4 py-3">
          <MarkdownBlock content={content} />
        </div>
      )}
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
    return "### Trả lời trọng tâm\nĐã tạo báo cáo chi tiết. Chọn mục bên dưới để xem.";
  }

  return "AI Advisor chưa trả về nội dung phù hợp.";
}

export function AIAdvisor() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
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

  const toggleSection = (
    messageId: string,
    section: "technical" | "fundamental" | "investment",
  ) => {
    setExpanded((prev) => ({
      ...prev,
      [messageId]: {
        technical: prev[messageId]?.technical ?? false,
        fundamental: prev[messageId]?.fundamental ?? false,
        investment: prev[messageId]?.investment ?? false,
        [section]: !(prev[messageId]?.[section] ?? false),
      },
    }));
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
          investment: false,
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
    <div className="max-w-md mx-auto min-h-screen pb-24">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-white hover:bg-white/20"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-semibold">AI Advisor</h1>
        </div>

        <p className="text-sm text-slate-300">
          Hỏi về phân tích cơ bản, kỹ thuật hoặc tư vấn đầu tư.
        </p>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {messages.map((message) => {
          const messageExpand = expanded[message.id] ?? {
            technical: false,
            fundamental: false,
            investment: false,
          };

          return (
            <Card
              key={message.id}
              className={`p-4 border ${
                message.role === "user"
                  ? "bg-cyan-950/40 border-cyan-800"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-cyan-300" />
                  ) : (
                    <Bot className="w-4 h-4 text-emerald-300" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-2">
                    {message.role === "user" ? "Bạn" : "AI Advisor"}
                  </p>

                  {message.role === "assistant" ? (
                    <div className="space-y-3">
                      <MarkdownBlock content={message.content} />

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

                      <ReportSection
                        title="Tư vấn đầu tư"
                        content={message.investmentAnalysis}
                        isOpen={messageExpand.investment}
                        onToggle={() => toggleSection(message.id, "investment")}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-100 whitespace-pre-wrap leading-6">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {isSending && (
          <Card className="p-4 border bg-slate-900 border-slate-800">
            <div className="flex items-start gap-3">
              <Bot className="w-4 h-4 text-emerald-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-2">AI Advisor</p>
                <p className="text-sm text-slate-300 leading-6">
                  AI đang phân tích, vui lòng chờ...
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="fixed left-1/2 bottom-0 w-full max-w-md -translate-x-1/2 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nhập câu hỏi tài chính..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400"
          />
          <Button onClick={handleSend} disabled={isSending || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}