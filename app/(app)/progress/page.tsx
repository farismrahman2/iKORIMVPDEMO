"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { ExamSession, ReadinessBand, SkillTag } from "@/types";

const BAND_COLORS: Record<ReadinessBand, string> = {
  strong: "text-band-strong",
  probable: "text-band-probable",
  borderline: "text-band-borderline",
  high_risk: "text-band-high_risk",
};

export default function ProgressPage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Exams Taken", value: stats.totalExams },
          { label: "Questions Answered", value: stats.totalQuestions },
          { label: "Current Streak", value: stats.streakRecord },
          { label: "Cards Reviewed", value: stats.flashcardsReviewed },
        ].map((stat) => (
          <div key={stat.label} className="bg-navy-light rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent-orange">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Score Trend Chart */}
      {sessions.length > 1 && (
        <div className="bg-navy-light rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Score Trend
          </h3>
          <ScoreTrendChart sessions={sessions} />
        </div>
      )}

      {/* Exam History */}
      <div className="bg-navy-light rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Exam History
        </h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No exams completed yet.
          </p>
        ) : (
          <div className="space-y-2">
            {[...sessions].reverse().map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-navy hover:bg-navy-lighter transition-colors"
              >
                <div>
                  <p className="text-sm text-white capitalize">
                    {session.exam_type} Mock
                    {session.section_filter && ` (${session.section_filter})`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.started_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
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
        <div className="bg-navy-light rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            All Skills
          </h3>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.skill_tag}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300 capitalize">
                    {skill.skill_tag.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`font-medium ${
                      skill.score < 60
                        ? "text-band-high_risk"
                        : skill.score >= 80
                        ? "text-band-strong"
                        : "text-gray-300"
                    }`}
                  >
                    {Math.round(skill.score)}%
                  </span>
                </div>
                <div className="h-1.5 bg-navy-lighter rounded-full overflow-hidden">
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

  const points = scores.map((score, i) => ({
    x: padding + (i / (scores.length - 1)) * (width - 2 * padding),
    y: padding + ((maxScore - score) / range) * (height - 2 * padding),
  }));

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
              stroke="#1A2A44"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <text x={padding - 5} y={y + 3} fill="#6B7280" fontSize="8" textAnchor="end">
              {pct}%
            </text>
          </g>
        );
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#F97316" strokeWidth="2" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#F97316"
        />
      ))}
    </svg>
  );
}
