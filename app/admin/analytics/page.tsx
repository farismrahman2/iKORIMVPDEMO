"use client";

import { useEffect, useState } from "react";
import { Users, FileText, BarChart3 } from "lucide-react";

interface AnalyticsData {
  users: { total: number; active_7d: number };
  exams: { total: number; band_distribution: Record<string, number> };
  skills: { averages: Record<string, number> };
  content: {
    questions_by_section: Record<string, number>;
    questions_by_skill: Record<string, number>;
  };
  recent_exams: {
    id: string;
    user_id: string;
    exam_type: string;
    weighted_score: number | null;
    readiness_band: string | null;
    submitted_at: string | null;
  }[];
}

const BAND_COLORS: Record<string, string> = {
  strong: "bg-band-strong",
  probable: "bg-band-probable",
  borderline: "bg-band-borderline",
  high_risk: "bg-band-high_risk",
};

const BAND_LABELS: Record<string, string> = {
  strong: "Strong Pass",
  probable: "Probable Pass",
  borderline: "Borderline",
  high_risk: "High Risk",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        setData(json);
      } catch {
        // Silently fail
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-ikori-muted">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-ikori-muted py-12">Failed to load analytics.</div>;
  }

  const totalBandExams = Object.values(data.exams.band_distribution).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-ikori-dark mb-6">Analytics</h1>

      {/* User Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-ikori p-4 border border-ikori-border">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-ikori-500" />
            <span className="text-xs text-ikori-muted">Total Users</span>
          </div>
          <p className="text-2xl font-display font-bold text-ikori-dark">{data.users.total}</p>
        </div>
        <div className="bg-white rounded-ikori p-4 border border-ikori-border">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-band-strong" />
            <span className="text-xs text-ikori-muted">Active (7d)</span>
          </div>
          <p className="text-2xl font-display font-bold text-ikori-dark">{data.users.active_7d}</p>
        </div>
        <div className="bg-white rounded-ikori p-4 border border-ikori-border">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-band-probable" />
            <span className="text-xs text-ikori-muted">Exams Taken</span>
          </div>
          <p className="text-2xl font-display font-bold text-ikori-dark">{data.exams.total}</p>
        </div>
      </div>

      {/* Band Distribution */}
      <div className="bg-white rounded-ikori p-4 border border-ikori-border mb-6">
        <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-4">
          Readiness Band Distribution
        </h3>
        {totalBandExams === 0 ? (
          <p className="text-sm text-ikori-muted">No exam data yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(data.exams.band_distribution).map(([band, count]) => {
              const pct = totalBandExams > 0 ? (count / totalBandExams) * 100 : 0;
              return (
                <div key={band}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ikori-body">{BAND_LABELS[band] || band}</span>
                    <span className="text-ikori-muted">
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-ikori-surface rounded-ikori-full overflow-hidden">
                    <div
                      className={`h-full rounded-ikori-full ${BAND_COLORS[band] || "bg-gray-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Coverage */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-ikori p-4 border border-ikori-border">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
            Questions by Section
          </h3>
          <div className="space-y-2">
            {Object.entries(data.content.questions_by_section).map(([section, count]) => (
              <div key={section} className="flex justify-between text-sm">
                <span className="text-ikori-body">{section.replace(/_/g, " ")}</span>
                <span className="text-ikori-dark font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(data.content.questions_by_section).length === 0 && (
              <p className="text-sm text-ikori-muted">No questions yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-ikori p-4 border border-ikori-border">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
            Skill Tag Coverage
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {Object.entries(data.content.questions_by_skill)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, count]) => (
                <div key={tag} className="flex justify-between text-sm">
                  <span className="text-ikori-body text-xs">{tag.replace(/_/g, " ")}</span>
                  <span
                    className={`font-medium text-xs ${
                      count < 10 ? "text-red-400" : "text-ikori-dark"
                    }`}
                  >
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Platform Skill Averages */}
      {Object.keys(data.skills.averages).length > 0 && (
        <div className="bg-white rounded-ikori p-4 border border-ikori-border mb-6">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
            <BarChart3 size={14} className="inline mr-1" />
            Platform Skill Averages
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(data.skills.averages)
              .sort(([, a], [, b]) => a - b)
              .map(([tag, avg]) => (
                <div
                  key={tag}
                  className="flex items-center justify-between px-3 py-2 rounded-ikori-sm bg-ikori-surface"
                >
                  <span className="text-xs text-ikori-muted">{tag.replace(/_/g, " ")}</span>
                  <span
                    className={`text-xs font-medium ${
                      avg < 60 ? "text-red-400" : avg >= 80 ? "text-green-400" : "text-ikori-body"
                    }`}
                  >
                    {avg}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Exams */}
      <div className="bg-white rounded-ikori p-4 border border-ikori-border">
        <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
          Recent Exams
        </h3>
        {data.recent_exams.length === 0 ? (
          <p className="text-sm text-ikori-muted">No exams completed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ikori-muted text-left">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Band</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_exams.map((exam) => (
                  <tr key={exam.id} className="border-t border-ikori-border">
                    <td className="py-2 pr-4 text-ikori-body">{exam.exam_type}</td>
                    <td className="py-2 pr-4 text-ikori-dark font-medium">
                      {exam.weighted_score != null ? `${Math.round(exam.weighted_score)}%` : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {exam.readiness_band && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-ikori-full ${
                            exam.readiness_band === "strong"
                              ? "bg-band-strong/20 text-band-strong"
                              : exam.readiness_band === "probable"
                              ? "bg-band-probable/20 text-band-probable"
                              : exam.readiness_band === "borderline"
                              ? "bg-band-borderline/20 text-band-borderline"
                              : "bg-band-high_risk/20 text-band-high_risk"
                          }`}
                        >
                          {BAND_LABELS[exam.readiness_band] || exam.readiness_band}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-ikori-muted">
                      {exam.submitted_at
                        ? new Date(exam.submitted_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
