"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, Lock, OctagonAlert } from "lucide-react";

interface SafetyBannerProps {
  content: string;
}

export function detectSafetyKeywords(text: string): {
  isLoto: boolean;
  isEStop: boolean;
  isHighVoltage: boolean;
} {
  const lower = text.toLowerCase();
  const isLoto =
    lower.includes("lockout") ||
    lower.includes("tagout") ||
    lower.includes("loto") ||
    lower.includes("de-energiz");
  const isEStop =
    lower.includes("emergency stop") ||
    lower.includes("e-stop") ||
    lower.includes("pb-0") ||
    lower.includes("mushroom-head");
  const isHighVoltage =
    lower.includes("high voltage") ||
    lower.includes("480v") ||
    lower.includes("arc-flash");

  return { isLoto, isEStop, isHighVoltage };
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ content }) => {
  const { isLoto, isEStop, isHighVoltage } = detectSafetyKeywords(content);

  if (!isLoto && !isEStop && !isHighVoltage) {
    return null;
  }

  return (
    <div className="my-3 rounded-lg border-2 border-amber-500/80 bg-amber-500/10 p-3.5 shadow-sm text-foreground overflow-hidden relative">
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          {isHighVoltage ? (
            <OctagonAlert className="w-5 h-5 animate-pulse text-red-500" />
          ) : isLoto ? (
            <Lock className="w-5 h-5 text-amber-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500 text-black">
              Safety Warning
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {isLoto && isEStop
                ? "LOTO & Emergency Stop Required"
                : isLoto
                ? "Lockout / Tagout (SOP-SAF-02) Mandatory"
                : isEStop
                ? "Emergency Stop Protocol Active"
                : "Hazardous Energy Isolation"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
            {isLoto
              ? "This operation carries critical mechanical or electrical hazard risks. Never insert hands or tools into moving machinery without isolating energy and applying your personal red safety padlock."
              : isEStop
              ? "Ensure equipment is completely halted at the operator E-Stop switch before approaching interlocks or clearing mechanical obstructions."
              : "Verify zero-energy state with certified instruments before opening electrical enclosures."}
          </p>
        </div>
      </div>
    </div>
  );
};
