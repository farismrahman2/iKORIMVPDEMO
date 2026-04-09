"use client";

import type { SkillTag } from "@/types";

interface SkillRadarProps {
  skills: { skill_tag: SkillTag; score: number }[];
  onSkillClick?: (skill: SkillTag) => void;
}

const SHORT_LABELS: Record<string, string> = {
  kana_recognition: "Kana",
  kanji_reading: "Kanji",
  word_meaning: "Meaning",
  vocab_usage: "Usage",
  particle: "Particle",
  verb_form: "Verb",
  adjective_form: "Adj.",
  sentence_completion: "Sent.",
  sentence_order: "Order",
  short_reading: "Read",
  notice_reading: "Notice",
  listening_gist: "Gist",
  listening_detail: "Detail",
  listening_response: "Reply",
  listening_sequence: "Seq.",
};

export default function SkillRadar({ skills, onSkillClick }: SkillRadarProps) {
  const size = 300;
  const center = size / 2;
  const maxRadius = center - 50;
  const levels = 5;
  const count = skills.length;

  if (count === 0) {
    return (
      <div className="card text-center">
        <p className="text-ikori-muted">Complete a diagnostic to see your skill radar.</p>
      </div>
    );
  }

  const angleStep = (2 * Math.PI) / count;

  function getPoint(angle: number, radius: number) {
    return {
      x: center + radius * Math.sin(angle),
      y: center - radius * Math.cos(angle),
    };
  }

  function getColor(score: number) {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  }

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const r = (maxRadius / levels) * (i + 1);
    const points = Array.from({ length: count }, (_, j) => {
      const p = getPoint(j * angleStep, r);
      return `${p.x},${p.y}`;
    }).join(" ");
    return (
      <polygon
        key={i}
        points={points}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="1"
      />
    );
  });

  // Axis lines
  const axisLines = skills.map((_, i) => {
    const p = getPoint(i * angleStep, maxRadius);
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={p.x}
        y2={p.y}
        stroke="#E5E7EB"
        strokeWidth="1"
      />
    );
  });

  // Data polygon
  const dataPoints = skills.map((s, i) => {
    const r = (s.score / 100) * maxRadius;
    const p = getPoint(i * angleStep, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Labels
  const labels = skills.map((s, i) => {
    const p = getPoint(i * angleStep, maxRadius + 25);
    const label = SHORT_LABELS[s.skill_tag] || s.skill_tag;
    const color = getColor(s.score);

    return (
      <text
        key={s.skill_tag}
        x={p.x}
        y={p.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="10"
        fontWeight="600"
        className="cursor-pointer"
        onClick={() => onSkillClick?.(s.skill_tag)}
      >
        {label}
      </text>
    );
  });

  // Score dots
  const dots = skills.map((s, i) => {
    const r = (s.score / 100) * maxRadius;
    const p = getPoint(i * angleStep, r);
    const color = getColor(s.score);

    return (
      <circle
        key={s.skill_tag}
        cx={p.x}
        cy={p.y}
        r="4"
        fill={color}
        className="cursor-pointer"
        onClick={() => onSkillClick?.(s.skill_tag)}
      />
    );
  });

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
        Skill Radar
      </h3>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[300px] mx-auto"
      >
        {gridCircles}
        {axisLines}
        <polygon
          points={dataPoints}
          fill="rgba(16, 185, 129, 0.15)"
          stroke="#10B981"
          strokeWidth="2"
        />
        {dots}
        {labels}
      </svg>
    </div>
  );
}
