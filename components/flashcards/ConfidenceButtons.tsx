"use client";

import type { Confidence } from "@/types";

interface ConfidenceButtonsProps {
  onRate: (confidence: Confidence) => void;
  disabled?: boolean;
}

const BUTTONS: { confidence: Confidence; label: string; classes: string }[] = [
  { confidence: "again", label: "Again", classes: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" },
  { confidence: "hard", label: "Hard", classes: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" },
  { confidence: "good", label: "Good", classes: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" },
  { confidence: "easy", label: "Easy", classes: "bg-ikori-50 text-ikori-700 border border-ikori-200 hover:bg-ikori-100" },
];

export default function ConfidenceButtons({ onRate, disabled }: ConfidenceButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BUTTONS.map((btn) => (
        <button
          key={btn.confidence}
          onClick={() => onRate(btn.confidence)}
          disabled={disabled}
          className={`min-h-[48px] rounded-ikori-sm font-semibold text-sm transition-colors font-sans ${btn.classes} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
