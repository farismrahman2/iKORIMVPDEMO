"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TranscriptUnlockProps {
  script: string;
  translationBn?: string | null;
  unlocked: boolean;
  audioUrl?: string | null;
}

export default function TranscriptUnlock({
  script,
  translationBn,
  unlocked,
}: TranscriptUnlockProps) {
  const { t } = useLanguage();
  const [showRomaji, setShowRomaji] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!unlocked) {
    return (
      <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 text-center">
        <p className="text-ikori-muted text-sm font-sans">
          Answer the question to unlock the transcript
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-sm text-ikori-body hover:text-ikori-dark transition-colors font-sans"
      >
        <span className="font-medium">{t('show_transcript')}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-ikori-50 mx-3 mb-3 rounded-ikori-sm p-4">
          {/* Japanese script */}
          <p className="text-ikori-dark leading-relaxed font-sans" style={{ fontSize: "1.1rem" }}>
            {script}
          </p>

          {/* Romaji toggle */}
          <button
            onClick={() => setShowRomaji(!showRomaji)}
            className="text-xs text-ikori-500 hover:underline font-sans"
          >
            {showRomaji ? `Hide ${t('romaji').toLowerCase()}` : t('romaji')}
          </button>

          {showRomaji && (
            <p className="text-sm text-ikori-muted italic font-sans">
              (Romaji transcription not available for this clip)
            </p>
          )}

          {/* Translation */}
          {translationBn && (
            <div className="pt-2 border-t border-ikori-border">
              <p className="text-xs text-ikori-muted mb-1 font-sans">{t('translation')}</p>
              <p className="text-sm text-ikori-muted font-sans">{translationBn}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
