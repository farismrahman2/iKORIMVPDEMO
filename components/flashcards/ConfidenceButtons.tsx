"use client";

import { useLanguage } from "@/lib/language-context";
import type { Confidence } from "@/types";

interface ConfidenceButtonsProps {
  onRate: (confidence: Confidence) => void;
  disabled?: boolean;
}

const BUTTON_STYLES: Record<Confidence, string> = {
  again: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
  hard: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
  good: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
  easy: "bg-ikori-50 text-ikori-700 border border-ikori-200 hover:bg-ikori-100",
};

export default function ConfidenceButtons({ onRate, disabled }: ConfidenceButtonsProps) {
  const { t } = useLanguage();

  const BUTTONS: { confidence: Confidence; label: string; classes: string }[] = [
    { confidence: "again", label: t('again'), classes: BUTTON_STYLES.again },
    { confidence: "hard", label: t('hard'), classes: BUTTON_STYLES.hard },
    { confidence: "good", label: t('good'), classes: BUTTON_STYLES.good },
    { confidence: "easy", label: t('easy'), classes: BUTTON_STYLES.easy },
  ];

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
