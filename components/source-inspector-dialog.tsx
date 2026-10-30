"use client";

import React, { useEffect } from "react";
import { X, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { RetrievedChunk } from "@/lib/retrieval";

interface SourceInspectorDialogProps {
  chunk: RetrievedChunk | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceInspectorDialog: React.FC<SourceInspectorDialogProps> = ({
  chunk,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !chunk) return null;

  const similarityPercent = (chunk.similarity * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-card text-card-foreground border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  Approved Procedure
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {similarityPercent}% Match
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-1">
                {chunk.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Subheader */}
        <div className="px-6 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Section: <span className="text-primary font-mono">{chunk.section}</span>
          </span>
          <span className="font-mono text-zinc-500">Chunk ID #{chunk.chunkId}</span>
        </div>

        {/* Body / Verbatim Passage */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-foreground/90 font-mono whitespace-pre-wrap bg-zinc-950/5 dark:bg-zinc-950/40 rounded-b-xl m-2 border border-border/50">
          {chunk.content}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Regulated by Plant Safety & Quality SOP Standards</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
