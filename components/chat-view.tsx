"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Wrench,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Bot,
  User,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { SafetyBanner } from "./safety-banner";
import { SourceChip } from "./source-chip";
import { SourceInspectorDialog } from "./source-inspector-dialog";
import { TicketDraftCard } from "./ticket-draft-card";
import { RetrievedChunk } from "@/lib/retrieval";

const SUGGESTED_PROMPTS = [
  "Machine 3 is jamming, what do I do?",
  "LOTO steps",
  "Coolant leak response",
];

export const ChatView: React.FC = () => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
  } = useChat({
    api: "/api/chat",
    maxSteps: 3,
  });

  const [selectedChunk, setSelectedChunk] = useState<RetrievedChunk | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handlePromptClick = (promptText: string) => {
    append({
      role: "user",
      content: promptText,
    });
  };

  const handleOpenInspector = (chunk: RetrievedChunk) => {
    setSelectedChunk(chunk);
    setIsInspectorOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top Industrial Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur z-20 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-black text-base shadow-md">
                OP
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
                  <span>OpsPilot</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    SOP CO-PILOT
                  </span>
                </h1>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Line B • Thermoforming & Packaging Cell</span>
                <span className="text-zinc-400">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Grounded in Approved SOPs
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold shadow-sm transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Audit Trail</span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </Link>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Factory Operations Co-Pilot
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                OpsPilot provides strict, procedure-grounded answers for machinery troubleshooting,
                safety protocols, and maintenance drafting. Uncovered questions are refused automatically.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full max-w-lg space-y-2 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggested Operator Inquiries</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="p-3 text-left rounded-xl border border-border bg-card hover:bg-accent hover:border-amber-500/50 text-foreground text-xs font-semibold shadow-sm transition-all flex items-center justify-between group"
                  >
                    <span>&ldquo;{prompt}&rdquo;</span>
                    <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[11px]">
                      Ask →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zero Direct Physical Action Notice */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2 max-w-lg">
              <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Safety Assurance: OpsPilot cannot actuate machinery or save records without manual operator sign-off.
              </span>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {messages.map((message) => {
          const isUser = message.role === "user";

          // Extract retrieved chunks from searchProcedures tool invocations
          const retrievedChunks: RetrievedChunk[] = [];
          if (message.toolInvocations) {
            for (const invocation of message.toolInvocations) {
              if (invocation.toolName === "searchProcedures" && "result" in invocation) {
                const res = invocation.result as any;
                if (res && res.results && Array.isArray(res.results)) {
                  retrievedChunks.push(...res.results);
                }
              }
            }
          }

          // Extract text citations matching [Doc Title, Section]
          const citationRegex = /\[([^\]]+?,\s*[^\]]+?)\]/g;
          const textCitations: { title: string; section: string }[] = [];
          let match;
          while ((match = citationRegex.exec(message.content)) !== null) {
            const raw = match[1];
            const parts = raw.split(",");
            if (parts.length >= 2) {
              const docTitle = parts[0].trim();
              const docSec = parts.slice(1).join(",").trim();
              if (docTitle.length > 3 && docSec.length > 2) {
                textCitations.push({ title: docTitle, section: docSec });
              }
            }
          }

          return (
            <div
              key={message.id}
              className={`flex gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1 shadow-sm font-bold text-xs">
                  OP
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                    : "bg-card text-card-foreground border border-border rounded-bl-none"
                }`}
              >
                {/* User Message */}
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : (
                  <div className="space-y-3">
                    {/* Real-time Safety Banner */}
                    <SafetyBanner content={message.content} />

                    {/* Markdown Body */}
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-pre:rounded-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Render Ticket Draft Cards if draftTicket was called */}
                    {message.toolInvocations?.map((invocation) => {
                      if (invocation.toolName === "draftTicket") {
                        const args = invocation.args as any;
                        return (
                          <TicketDraftCard
                            key={invocation.toolCallId}
                            initialMachine={args?.machine}
                            initialTitle={args?.title}
                            initialDescription={args?.description}
                            initialPriority={args?.priority}
                            sourceChunkIds={args?.sourceChunkIds || []}
                            toolCallId={invocation.toolCallId}
                          />
                        );
                      }
                      return null;
                    })}

                    {/* Source Chips Section */}
                    {(retrievedChunks.length > 0 || textCitations.length > 0) && (
                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>Approved Procedure Citations:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {retrievedChunks.map((chunk) => (
                            <SourceChip
                              key={chunk.chunkId}
                              title={chunk.title}
                              section={chunk.section}
                              chunk={chunk}
                              onClick={handleOpenInspector}
                            />
                          ))}
                          {retrievedChunks.length === 0 &&
                            textCitations.map((c, i) => (
                              <SourceChip
                                key={i}
                                title={c.title}
                                section={c.section}
                                onClick={handleOpenInspector}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground animate-in fade-in">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border text-foreground space-y-1">
              <p className="font-semibold flex items-center gap-2">
                <span>Searching approved procedure documents...</span>
              </p>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Error generating response: {error.message}</span>
              </p>
              <button
                onClick={() => reload()}
                className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground text-[11px] font-semibold"
              >
                Retry
              </button>
            </div>
            {error.message?.toLowerCase().includes("key") ? (
              <p className="text-[11px] opacity-80">
                Ensure your GOOGLE_GENERATIVE_AI_API_KEY is configured in your environment or .env.local.
              </p>
            ) : (
              <p className="text-[11px] opacity-80">
                Please check your network connection or click Retry.
              </p>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <footer className="border-t border-border bg-card/90 backdrop-blur p-4 shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick suggested chips above input when chatting */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground">
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider">
                Quick Prompts:
              </span>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromptClick(p)}
                  className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground shrink-0 border border-border text-[11px] transition-colors"
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePromptClick("Create a high-priority ticket for this")}
                className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0 text-[11px] font-semibold transition-colors"
              >
                + Draft Ticket
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask questions on plant procedures, error codes, or ask to draft a ticket..."
              disabled={isLoading}
              className="w-full pl-4 pr-24 py-3 rounded-xl border border-input bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-bold text-xs shadow transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>Grounding: 6 Approved SOP Documents (pgvector RAG)</span>
            <span>Refuses out-of-scope questions automatically</span>
          </div>
        </div>
      </footer>

      {/* Source Passage Inspector Dialog */}
      <SourceInspectorDialog
        chunk={selectedChunk}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
};
