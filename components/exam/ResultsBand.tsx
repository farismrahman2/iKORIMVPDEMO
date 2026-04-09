"use client";

import type { ReadinessBand, SectionScores } from "@/types";

interface ResultsBandProps {
  readinessBand: ReadinessBand;
  weightedScore: number;
  sectionScores: SectionScores;
}

const BAND_CONFIG: Record<
  ReadinessBand,
  { label: string; color: string; barColor: string }
> = {
  strong: {
    label: "Strong Pass",
    color: "text-ikori-500",
    barColor: "bg-ikori-500",
  },
  probable: {
    label: "Probable Pass",
    color: "text-blue-500",
    barColor: "bg-blue-500",
  },
  borderline: {
    label: "Borderline",
    color: "text-amber-500",
    barColor: "bg-amber-500",
  },
  high_risk: {
    label: "High Risk",
    color: "text-red-500",
    barColor: "bg-red-500",
  },
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ikori-muted">{label}</span>
        <span className="text-ikori-dark font-medium">{Math.round(safeScore)}%</span>
      </div>
      <div className="h-2 bg-ikori-100 rounded-full overflow-hidden">
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
  const score = Math.round(weightedScore);

  return (
    <div className="space-y-6">
      {/* Main band display — gradient hero */}
      <div className="bg-ikori-gradient rounded-ikori p-5 text-center space-y-2">
        <p className="text-ikori-900 text-5xl font-display font-bold">{score}%</p>
        <p className="text-ikori-800 text-xl font-semibold">{config.label}</p>
        <p className="text-ikori-700 text-sm">Readiness Score</p>
      </div>

      {/* Section breakdown */}
      <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">
          Section Scores
        </h3>
        <ScoreBar
          label="Vocabulary"
          score={sectionScores.vocab}
          color={sectionScores.vocab >= 60 ? "bg-ikori-500" : "bg-red-500"}
        />
        <ScoreBar
          label="Grammar & Reading"
          score={sectionScores.grammar_reading}
          color={sectionScores.grammar_reading >= 60 ? "bg-ikori-500" : "bg-red-500"}
        />
        <ScoreBar
          label="Listening"
          score={sectionScores.listening}
          color={sectionScores.listening >= 60 ? "bg-ikori-500" : "bg-red-500"}
        />
      </div>
    </div>
  );
}
