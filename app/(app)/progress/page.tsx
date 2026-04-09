"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { getSkillLabel } from "@/lib/i18n";
import type { ExamSession, ReadinessBand, SkillTag } from "@/types";

const BAND_COLORS: Record<ReadinessBand, string> = {
  strong: "text-band-strong",
  probable: "text-band-probable",
  borderline: "text-band-borderline",
  high_risk: "text-band-high_risk",
};

export default function ProgressPage() {
  const { t, lang } = useLanguage();

  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [skills, setSkills] = useState<{ skill_tag: SkillTag; score: number }[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    totalQuestions: 0,
    streakRecord: 0,
    flashcardsReviewed: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Load exam sessions
      const { data: sessionData } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "submitted")
        .order("started_at", { ascending: true });

      if (sessionData) {
        setSessions(sessionData as ExamSession[]);
      }

      // Load skill scores
      const { data: skillData } = await supabase
        .from("user_skill_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("score", { ascending: true });

      if (skillData) {
        setSkills(
          skillData.map((s: { skill_tag: string; score: number }) => ({
            skill_tag: s.skill_tag as SkillTag,
            score: s.score,
          }))
        );
      }

      // Count responses
      const { count: responseCount } = await supabase
        .from("exam_responses")
        .select("*", { count: "exact", head: true })
        .in(
          "session_id",
          (sessionData || []).map((s: ExamSession) => s.id)
        );

      // Count flashcard reviews
      const { count: flashcardCount } = await supabase
        .from("flashcard_state")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gt("review_count", 0);

      // Get profile for streak
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("streak")
        .eq("id", user.id)
        .single();

      setStats({
        totalExams: (sessionData || []).length,
        totalQuestions: responseCount || 0,
        streakRecord: profile?.streak || 0,
        flashcardsReviewed: flashcardCount || 0,
      });

      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted font-sans">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-bold font-display text-ikori-dark">{t('progress')}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t('total_exams'), value: stats.totalExams },
          { label: t('questions_answered'), value: stats.totalQuestions },
          { label: t('best_streak'), value: stats.streakRecord },
          { label: t('cards_reviewed'), value: stats.flashcardsReviewed },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 text-center">
            <p className="text-2xl font-bold text-ikori-500 font-display">{stat.value}</p>
            <p className="text-xs text-ikori-muted mt-1 font-sans">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Score Trend Chart */}
      {sessions.length > 1 && (
        <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3 font-sans">
            {t('score_trend')}
          </h3>
          <ScoreTrendChart sessions={sessions} />
        </div>
      )}

      {/* Exam History */}
      <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4">
        <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3 font-sans">
          {t('exam_history')}
        </h3>
        {sessions.length === 0 ? (
          <p className="text-ikori-muted text-sm text-center py-4 font-sans">
            {t('no_exams')}
          </p>
        ) : (
          <div className="space-y-2">
            {[...sessions].reverse().map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-ikori-sm bg-ikori-surface hover:bg-ikori-50 transition-colors"
              >
                <div>
                  <p className="text-sm text-ikori-dark capitalize font-sans">
                    {session.exam_type} Mock
                    {session.section_filter && ` (${session.section_filter})`}
                  </p>
                  <p className="text-xs text-ikori-muted font-sans">
                    {new Date(session.started_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ikori-dark font-sans">
                    {Math.round(session.weighted_score || 0)}%
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      BAND_COLORS[
                        (session.readiness_band as ReadinessBand) || "high_risk"
                      ]
                    }`}
                  >
                    {(session.readiness_band || "high_risk").replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Improvement */}
      {skills.length > 0 && (
        <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3 font-sans">
            All Skills
          </h3>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.skill_tag}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ikori-body font-sans">
                    {getSkillLabel(skill.skill_tag, lang)}
                  </span>
                  <span
                    className={`font-medium font-sans ${
                      skill.score < 60
                        ? "text-band-high_risk"
                        : skill.score >= 80
                        ? "text-band-strong"
                        : "text-ikori-body"
                    }`}
                  >
                    {Math.round(skill.score)}%
                  </span>
                </div>
                <div className="h-1.5 bg-ikori-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      skill.score < 60
                        ? "bg-band-high_risk"
                        : skill.score >= 80
                        ? "bg-band-strong"
                        : "bg-band-borderline"
                    }`}
                    style={{ width: `${Math.min(skill.score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreTrendChart({ sessions }: { sessions: ExamSession[] }) {
  const width = 300;
  const height = 120;
  const padding = 20;

  const scores = sessions.map((s) => s.weighted_score || 0);
  const maxScore = Math.max(...scores, 100);
  const minScore = Math.min(...scores, 0);
  const range = maxScore - minScore || 1;

  const points = scores.map((score, i) => {
    const xRatio = scores.length <= 1 ? 0.5 : i / (scores.length - 1);
    return {
      x: padding + xRatio * (width - 2 * padding),
      y: padding + ((maxScore - score) / range) * (height - 2 * padding),
    };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {[25, 50, 75].map((pct) => {
        const y = padding + ((maxScore - pct) / range) * (height - 2 * padding);
        return (
          <g key={pct}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <text x={padding - 5} y={y + 3} fill="#9CA3AF" fontSize="8" textAnchor="end">
              {pct}%
            </text>
          </g>
        );
      })}

      {/* Line — ikori-500 green */}
      <path d={pathD} fill="none" stroke="#34D399" strokeWidth="2" />

      {/* Dots — ikori-500 green */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#34D399"
        />
      ))}
    </svg>
  );
}
