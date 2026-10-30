"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { TicketRow } from "@/lib/db";

export default function TicketsAuditPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "rejected">("all");

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message || "Failed to load audit records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    if (filter === "approved") return t.status === "approved";
    if (filter === "rejected") return t.status === "rejected";
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to OpsPilot Chat</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-black text-sm shadow">
                OP
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Maintenance Audit Trail</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono border border-amber-500/20">
                    COMPLIANCE LOG
                  </span>
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Human-authorized maintenance events and safety interventions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input text-xs font-medium hover:bg-muted text-foreground transition-colors disabled:opacity-50"
              title="Refresh log"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Log</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Decisions
              </p>
              <p className="text-2xl font-black text-foreground mt-1">{tickets.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Approved Tickets
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {tickets.filter((t) => t.status === "approved").length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Operator Discarded
              </p>
              <p className="text-2xl font-black text-muted-foreground mt-1">
                {tickets.filter((t) => t.status === "rejected").length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted text-muted-foreground">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Filter Status:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-muted border border-border text-xs">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === "approved"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter("rejected")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === "rejected"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Discarded
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Immutable audit trail of plant operator sign-offs</span>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">
              Retrieving maintenance logs from database...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center space-y-2 text-destructive">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchTickets}
              className="mt-2 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
            <Wrench className="w-10 h-10 text-muted-foreground mx-auto stroke-[1.5]" />
            <h3 className="text-base font-bold text-foreground">No maintenance records found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Ask OpsPilot to draft a maintenance ticket in the chat interface. Once you approve
              the draft, it will be logged here with your operator signature.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs shadow hover:bg-amber-600 transition-colors"
            >
              Open OpsPilot Chat
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Machine</th>
                    <th className="py-3 px-4">Issue Title & Description</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Operator Sign-Off</th>
                    <th className="py-3 px-4">Decided At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTickets.map((t) => {
                    const isApproved = t.status === "approved";
                    const isHigh = t.priority === "high";
                    const isMed = t.priority === "medium";

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                          #{t.id}
                        </td>

                        {/* Machine */}
                        <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                          <span className="px-2 py-1 rounded bg-muted border border-border font-mono">
                            {t.machine}
                          </span>
                        </td>

                        {/* Title & Description */}
                        <td className="py-3.5 px-4 max-w-md space-y-1">
                          <div className="font-bold text-foreground line-clamp-1">{t.title}</div>
                          <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[11px]">
                            {t.description}
                          </p>
                          {t.source_chunk_ids && t.source_chunk_ids.length > 0 && (
                            <div className="flex items-center gap-1 pt-1 font-mono text-[10px] text-muted-foreground">
                              <span>Grounding:</span>
                              {t.source_chunk_ids.map((cid) => (
                                <span
                                  key={cid}
                                  className="px-1 py-0.2 rounded bg-muted border border-border"
                                >
                                  #{cid}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isHigh
                                ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                                : isMed
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isApproved
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Approved</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Discarded</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Operator */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{t.approved_by || "Operator 1"}</span>
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {t.decided_at
                                ? new Date(t.decided_at).toLocaleString()
                                : new Date(t.created_at).toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
