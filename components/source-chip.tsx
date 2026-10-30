"use client";

import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { RetrievedChunk } from "@/lib/retrieval";

interface SourceChipProps {
  title: string;
  section: string;
  chunk?: RetrievedChunk;
  onClick: (chunk: RetrievedChunk) => void;
}

export const SourceChip: React.FC<SourceChipProps> = ({
  title,
  section,
  chunk,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (chunk) {
      onClick(chunk);
    } else {
      onClick({
        chunkId: 0,
        title,
        section,
        content: `Passage from: ${title} > ${section}\n\n(See approved procedure manual for full historical revisions.)`,
        similarity: 1.0,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-150 group shadow-sm"
      title={`Inspect approved source: ${title} - ${section}`}
    >
      <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
      <span className="font-semibold truncate max-w-[180px] sm:max-w-[260px]">
        {title.replace(/^SOP-[A-Z0-9]+:\s*/, "")}
      </span>
      <span className="text-blue-400 dark:text-blue-500">•</span>
      <span className="truncate max-w-[120px] sm:max-w-[180px] font-mono text-[11px]">
        {section}
      </span>
      <ExternalLink className="w-3 h-3 text-blue-500/70 group-hover:text-blue-600 dark:group-hover:text-blue-300 ml-0.5 shrink-0" />
    </button>
  );
};
