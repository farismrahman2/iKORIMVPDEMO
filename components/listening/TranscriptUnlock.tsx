"use client";

import { useState } from "react";
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
  const [showRomaji, setShowRomaji] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!unlocked) {
    return (
      <div className="bg-navy-light rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">
          Answer the question to unlock the transcript
        </p>
      </div>
    );
  }

  return (
    <div className="bg-navy-light rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-sm text-gray-300 hover:text-white"
      >
        <span className="font-medium">Transcript</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Japanese script */}
          <p className="text-white leading-relaxed" style={{ fontSize: "1.1rem" }}>
            {script}
          </p>

          {/* Romaji toggle */}
          <button
            onClick={() => setShowRomaji(!showRomaji)}
            className="text-xs text-accent-orange hover:underline"
          >
            {showRomaji ? "Hide romaji" : "Show romaji"}
          </button>

          {showRomaji && (
            <p className="text-sm text-gray-400 italic">
              (Romaji transcription not available for this clip)
            </p>
          )}

          {/* Bangla translation */}
          {translationBn && (
            <div className="pt-2 border-t border-navy-lighter">
              <p className="text-sm text-gray-500">{translationBn}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
