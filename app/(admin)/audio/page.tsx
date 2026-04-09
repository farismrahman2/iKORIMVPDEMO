"use client";

import { useEffect, useState, useCallback } from "react";
import { Headphones, Play, RefreshCw, Loader2 } from "lucide-react";
import type { Question } from "@/types";

type AudioFilter = "missing" | "has_audio" | "all";

export default function AudioPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<AudioFilter>("missing");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, withAudio: 0, missing: 0 });

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: "questions",
        pageSize: "200",
        section: "listening",
      });

      const res = await fetch(`/api/admin/content?${params}`);
      const data = await res.json();
      const allQuestions = (data.items || []) as Question[];

      const withAudio = allQuestions.filter((q) => q.audio_url);
      const missing = allQuestions.filter((q) => !q.audio_url);

      setStats({
        total: allQuestions.length,
        withAudio: withAudio.length,
        missing: missing.length,
      });

      if (filter === "missing") {
        setQuestions(missing);
      } else if (filter === "has_audio") {
        setQuestions(withAudio);
      } else {
        setQuestions(allQuestions);
      }
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function generateAudio(questionId: string) {
    setGenerating((prev) => new Set(prev).add(questionId));
    try {
      const res = await fetch("/api/admin/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_ids: [questionId], speaker: "female" }),
      });
      const data = await res.json();
      if (data.success > 0) {
        loadQuestions();
      }
    } catch {
      // Silently fail
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  async function bulkGenerate() {
    const missingQuestions = questions.filter((q) => !q.audio_url && q.audio_script);
    if (missingQuestions.length === 0) return;

    setBulkGenerating(true);
    setBulkProgress({ done: 0, total: missingQuestions.length });

    // Process in batches of 10
    for (let i = 0; i < missingQuestions.length; i += 10) {
      const batch = missingQuestions.slice(i, i + 10);
      const ids = batch.map((q) => q.id);

      try {
        const res = await fetch("/api/admin/audio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_ids: ids, speaker: "female" }),
        });
        const data = await res.json();
        setBulkProgress((prev) => ({
          ...prev,
          done: prev.done + (data.processed || 0),
        }));
      } catch {
        setBulkProgress((prev) => ({
          ...prev,
          done: prev.done + batch.length,
        }));
      }
    }

    setBulkGenerating(false);
    loadQuestions();
  }

  function playAudio(url: string, questionId: string) {
    if (playingId === questionId) {
      setPlayingId(null);
      return;
    }
    setPlayingId(questionId);
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  }

  const missingWithScript = questions.filter((q) => !q.audio_url && q.audio_script).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Audio Manager</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-navy-light rounded-xl p-4 border border-navy-lighter text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Listening Questions</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.withAudio}</p>
          <p className="text-xs text-gray-500">With Audio</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.missing}</p>
          <p className="text-xs text-gray-500">Missing Audio</p>
        </div>
      </div>

      {/* Filter + Bulk Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["missing", "has_audio", "all"] as AudioFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f
                  ? "bg-accent-orange text-white"
                  : "bg-navy-light text-gray-400 hover:text-white"
              }`}
            >
              {f === "missing" ? "Missing Audio" : f === "has_audio" ? "Has Audio" : "All"}
            </button>
          ))}
        </div>

        {filter === "missing" && missingWithScript > 0 && (
          <button
            onClick={bulkGenerate}
            disabled={bulkGenerating}
            className="px-4 py-2 rounded-lg bg-accent-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
          >
            {bulkGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating {bulkProgress.done}/{bulkProgress.total}
              </>
            ) : (
              <>
                <Headphones size={14} />
                Generate All Missing ({missingWithScript})
              </>
            )}
          </button>
        )}
      </div>

      {/* Bulk Progress */}
      {bulkGenerating && (
        <div className="mb-4">
          <div className="h-2 bg-navy-lighter rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-orange rounded-full transition-all"
              style={{
                width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 animate-pulse">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No questions found.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-navy-light rounded-xl p-4 border border-navy-lighter"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{q.question_text}</p>
                  {q.audio_script && (
                    <p className="text-xs text-gray-500 mt-1 italic truncate">
                      Script: {q.audio_script}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-navy-lighter text-gray-400">
                      {q.skill_tag}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-navy-lighter text-gray-400">
                      {q.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {q.audio_url ? (
                    <>
                      <button
                        onClick={() => playAudio(q.audio_url!, q.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          playingId === q.id
                            ? "bg-accent-orange text-white"
                            : "bg-navy-lighter text-gray-400 hover:text-white"
                        }`}
                      >
                        <Play size={14} />
                      </button>
                      <button
                        onClick={() => generateAudio(q.id)}
                        disabled={generating.has(q.id)}
                        className="p-2 rounded-lg bg-navy-lighter text-gray-400 hover:text-accent-orange disabled:opacity-50"
                        title="Regenerate"
                      >
                        {generating.has(q.id) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateAudio(q.id)}
                      disabled={generating.has(q.id) || !q.audio_script}
                      className="px-3 py-1.5 rounded-lg bg-accent-orange text-white text-xs font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {generating.has(q.id) ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Headphones size={12} />
                          Generate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
