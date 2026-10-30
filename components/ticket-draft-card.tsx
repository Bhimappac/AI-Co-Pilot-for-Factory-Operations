"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
} from "lucide-react";

interface TicketDraftCardProps {
  initialMachine?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialPriority?: "low" | "medium" | "high";
  sourceChunkIds?: number[];
  toolCallId?: string;
}

export const TicketDraftCard: React.FC<TicketDraftCardProps> = ({
  initialMachine = "Machine 3",
  initialTitle = "Maintenance Action Required",
  initialDescription = "",
  initialPriority = "medium",
  sourceChunkIds = [],
}) => {
  const [machine, setMachine] = useState(initialMachine);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialPriority);
  const [operatorName, setOperatorName] = useState("Operator Dave (Badge #4092)");

  const [state, setState] = useState<"idle" | "submitting" | "approved" | "rejected" | "error">("idle");
  const [savedTicketId, setSavedTicketId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setState("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine,
          title,
          description,
          priority,
          sourceChunkIds,
          operatorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve ticket");
      }

      setSavedTicketId(data.ticket.id);
      setState("approved");
    } catch (err: any) {
      console.error("Failed to approve ticket:", err);
      setErrorMessage(err.message || "Failed to submit ticket approval");
      setState("error");
    }
  };

  const handleReject = async () => {
    setState("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/tickets/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine,
          title,
          description,
          priority,
          sourceChunkIds,
          operatorName,
          reason: "Operator rejected ticket draft in chat interface",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record ticket rejection");
      }

      setState("rejected");
    } catch (err: any) {
      console.error("Failed to reject ticket:", err);
      setErrorMessage(err.message || "Failed to discard ticket draft");
      setState("error");
    }
  };

  if (state === "approved") {
    return (
      <div className="my-4 rounded-xl border-2 border-emerald-500/80 bg-emerald-500/10 p-5 shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-emerald-500 text-white shrink-0 shadow-md">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white">
                Ticket Approved & Recorded
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Authorized by: {operatorName}
              </span>
            </div>
            <h4 className="text-base font-bold text-foreground">
              Saved as Ticket #{savedTicketId}
            </h4>
            <p className="text-xs text-muted-foreground">
              Machine: <span className="font-semibold text-foreground">{machine}</span> • Priority:{" "}
              <span className="font-semibold text-foreground uppercase">{priority}</span>
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/tickets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
              >
                <span>View in Audit Trail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <span className="text-xs text-muted-foreground">
                Recorded in compliance log with human sign-off.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="my-4 rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-4 opacity-75">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-zinc-400 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Draft Ticket Discarded
            </div>
            <p className="text-xs text-zinc-500">
              Operator rejected draft for {machine}: &ldquo;{title}&rdquo;. No record saved to database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-xl border-2 border-amber-500/60 bg-card text-card-foreground shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Maintenance Ticket Draft
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          Human Approval Required
        </div>
      </div>

      {/* Draft Form Body */}
      <div className="p-4 sm:p-5 space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Machine / Cell
            </label>
            <input
              type="text"
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. Machine 3"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Requires Shift Attention)</option>
              <option value="high">High (Immediate Production Interruption)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Operator Approval Signature
            </label>
            <div className="relative">
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 rounded-md border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Operator name"
              />
              <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-2" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Issue Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Issue summary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Detailed Diagnostic / Maintenance Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
            placeholder="Describe symptoms, steps performed, error codes, and required actions..."
          />
        </div>

        {sourceChunkIds && sourceChunkIds.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span>Grounding Chunks:</span>
            {sourceChunkIds.map((id) => (
              <span
                key={id}
                className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
              >
                #{id}
              </span>
            ))}
          </div>
        )}

        {errorMessage && (
          <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground italic">
            AI draft only. Nothing is saved until you click Approve.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={state === "submitting"}
              onClick={handleReject}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-input hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Discard Draft
            </button>
            <button
              type="button"
              disabled={state === "submitting" || !title.trim() || !machine.trim()}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black shadow transition-all disabled:opacity-50"
            >
              {state === "submitting" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve & Save Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
