"use client";

import type { ReadinessBand, SectionScores } from "@/types";

interface ResultsBandProps {
  readinessBand: ReadinessBand;
  weightedScore: number;
  sectionScores: SectionScores;
}

const BAND_CONFIG: Record<
  ReadinessBand,
  { label: string; color: string; bg: string; border: string }
> = {
  strong: {
    label: "Strong Pass",
    color: "text-band-strong",
    bg: "bg-band-strong/20",
    border: "border-band-strong",
  },
  probable: {
    label: "Probable Pass",
    color: "text-band-probable",
    bg: "bg-band-probable/20",
    border: "border-band-probable",
  },
  borderline: {
    label: "Borderline",
    color: "text-band-borderline",
    bg: "bg-band-borderline/20",
    border: "border-band-borderline",
  },
  high_risk: {
    label: "High Risk",
    color: "text-band-high_risk",
    bg: "bg-band-high_risk/20",
    border: "border-band-high_risk",
  },
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{Math.round(safeScore)}%</span>
      </div>
      <div className="h-2 bg-navy-lighter rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(safeScore, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultsBand({
  readinessBand,
  weightedScore,
  sectionScores,
}: ResultsBandProps) {
  const config = BAND_CONFIG[readinessBand];

  return (
    <div className="space-y-6">
      {/* Main band display */}
      <div className={`${config.bg} border ${config.border} rounded-2xl p-8 text-center`}>
        <p className={`text-5xl font-bold ${config.color}`}>
          {Math.round(weightedScore)}%
        </p>
        <p className={`text-xl font-semibold mt-2 ${config.color}`}>
          {config.label}
        </p>
        <p className="text-gray-400 text-sm mt-2">Readiness Score</p>
      </div>

      {/* Section breakdown */}
      <div className="bg-navy-light rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Section Scores
        </h3>
        <ScoreBar
          label="Vocabulary"
          score={sectionScores.vocab}
          color={sectionScores.vocab >= 60 ? "bg-band-strong" : "bg-band-high_risk"}
        />
        <ScoreBar
          label="Grammar & Reading"
          score={sectionScores.grammar_reading}
          color={sectionScores.grammar_reading >= 60 ? "bg-band-strong" : "bg-band-high_risk"}
        />
        <ScoreBar
          label="Listening"
          score={sectionScores.listening}
          color={sectionScores.listening >= 60 ? "bg-band-strong" : "bg-band-high_risk"}
        />
      </div>
    </div>
  );
}
