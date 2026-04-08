"use client";

import type { Confidence } from "@/types";

interface ConfidenceButtonsProps {
  onRate: (confidence: Confidence) => void;
  disabled?: boolean;
}

const BUTTONS: { confidence: Confidence; label: string; color: string; bgColor: string }[] = [
  { confidence: "again", label: "Again", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" },
  { confidence: "hard", label: "Hard", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20" },
  { confidence: "good", label: "Good", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
  { confidence: "easy", label: "Easy", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" },
];

export default function ConfidenceButtons({ onRate, disabled }: ConfidenceButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BUTTONS.map((btn) => (
        <button
          key={btn.confidence}
          onClick={() => onRate(btn.confidence)}
          disabled={disabled}
          className={`py-3 rounded-lg border font-semibold text-sm transition-colors ${btn.color} ${btn.bgColor} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
