"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, XCircle, Clock, Headphones } from "lucide-react";
import Link from "next/link";
import type { Question, ReadinessBand } from "@/types";

type TrialStep = "intro" | "questions" | "results";

interface TrialAnswer {
  question_id: string;
  user_answer: number;
  is_correct: boolean;
  skill_tag: string;
  section: string;
}

const BAND_THRESHOLDS: { min: number; band: ReadinessBand; label: string; color: string }[] = [
  { min: 79, band: "strong", label: "Strong Pass", color: "text-ikori-700 bg-ikori-50 border-ikori-200" },
  { min: 68, band: "probable", label: "Probable Pass", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { min: 55, band: "borderline", label: "Borderline", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { min: 0, band: "high_risk", label: "High Risk", color: "text-red-700 bg-red-50 border-red-200" },
];

function getBand(score: number) {
  return BAND_THRESHOLDS.find((b) => score >= b.min) || BAND_THRESHOLDS[3];
}

export default function TrialPage() {
  const [step, setStep] = useState<TrialStep>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<TrialAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  async function startTrial() {
    setLoading(true);
    try {
      const res = await fetch("/api/trial/questions");
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setStep("questions");
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  }

  function handleSelect(idx: number) {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);

    const q = questions[currentIdx];
    setAnswers((prev) => [
      ...prev,
      {
        question_id: q.id,
        user_answer: idx,
        is_correct: idx === q.correct_answer,
        skill_tag: q.skill_tag,
        section: q.section,
      },
    ]);
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      finishTrial();
    }
  }

  function finishTrial() {
    // Calculate scores
    const correct = answers.length > 0
      ? answers.filter((a) => a.is_correct).length + (selected !== null && selected === questions[currentIdx]?.correct_answer ? 1 : 0)
      : 0;
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Calculate section breakdown
    const allAnswers = [...answers];
    if (selected !== null && currentIdx === questions.length - 1) {
      const q = questions[currentIdx];
      allAnswers.push({
        question_id: q.id,
        user_answer: selected,
        is_correct: selected === q.correct_answer,
        skill_tag: q.skill_tag,
        section: q.section,
      });
    }

    const sections: Record<string, { correct: number; total: number }> = {};
    for (const a of allAnswers) {
      if (!sections[a.section]) sections[a.section] = { correct: 0, total: 0 };
      sections[a.section].total++;
      if (a.is_correct) sections[a.section].correct++;
    }

    // Store results in sessionStorage
    const result = {
      weighted_score: score,
      readiness_band: getBand(score).band,
      section_scores: {
        vocab: sections.vocab ? Math.round((sections.vocab.correct / sections.vocab.total) * 100) : 0,
        grammar_reading: sections.grammar_reading ? Math.round((sections.grammar_reading.correct / sections.grammar_reading.total) * 100) : 0,
        listening: sections.listening ? Math.round((sections.listening.correct / sections.listening.total) * 100) : 0,
      },
      answers: allAnswers,
      completed_at: new Date().toISOString(),
    };

    sessionStorage.setItem("ikori_trial_result", JSON.stringify(result));

    // Log trial event
    fetch("/api/trial/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "trial_completed",
        readiness_band: result.readiness_band,
      }),
    });

    setStep("results");
  }

  // Intro
  if (step === "intro") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <Link href="/" className="text-lg font-display font-bold text-ikori-dark">
            iKORI <span className="text-ikori-500">N5</span>
          </Link>
        </div>

        <div className="card-gradient text-center space-y-4 mb-8">
          <h1 className="text-2xl font-display font-bold text-ikori-900">
            Free N5 Diagnostic
          </h1>
          <p className="text-ikori-800 text-sm leading-relaxed">
            20 questions across vocabulary, grammar, and listening.
            Find out your readiness level — no account needed.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-ikori-700">
            <span className="flex items-center gap-1"><Clock size={14} /> ~10 min</span>
            <span className="flex items-center gap-1"><Headphones size={14} /> Audio included</span>
          </div>
        </div>

        <button
          onClick={startTrial}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
        >
          {loading ? "Loading questions..." : "Start Free Trial"}
          {!loading && <ArrowRight size={20} />}
        </button>
      </div>
    );
  }

  // Questions
  if (step === "questions" && questions.length > 0) {
    const q = questions[currentIdx];
    const options = (q.options || []) as string[];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-ikori-muted mb-2">
            <span>Question {currentIdx + 1} / {questions.length}</span>
            <span className="badge">{q.section.replace("_", " ")}</span>
          </div>
          <div className="h-[3px] bg-ikori-100 rounded-full">
            <div
              className="h-full bg-ikori-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Audio script fallback */}
        {q.audio_script && (
          <div className="card mb-4 text-center">
            <p className="text-xs text-ikori-muted mb-1">Audio Script</p>
            <p className="text-sm text-ikori-dark italic">{q.audio_script}</p>
          </div>
        )}

        {/* Question */}
        <h2 className="text-base font-medium text-ikori-dark mb-6 leading-relaxed" style={{ fontSize: "1rem" }}>
          {q.question_text}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {options.map((option, idx) => {
            let className =
              "w-full text-left p-4 rounded-ikori-sm border text-sm active:scale-[0.98] transition-all flex items-center gap-3 min-h-[52px] ";

            if (showResult) {
              if (idx === q.correct_answer) {
                className += "border-green-300 bg-green-50 text-green-800";
              } else if (idx === selected && idx !== q.correct_answer) {
                className += "border-red-300 bg-red-50 text-red-700";
              } else {
                className += "border-ikori-border bg-ikori-surface text-ikori-muted";
              }
            } else {
              className += "border-ikori-border bg-white text-ikori-dark hover:border-ikori-300";
            }

            return (
              <button key={idx} onClick={() => handleSelect(idx)} className={className}>
                <span className="text-ikori-muted font-medium w-6">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontSize: "1rem" }}>{option}</span>
                {showResult && idx === q.correct_answer && (
                  <CheckCircle size={16} className="ml-auto text-green-500 shrink-0" />
                )}
                {showResult && idx === selected && idx !== q.correct_answer && (
                  <XCircle size={16} className="ml-auto text-red-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && (
          <div className="space-y-3">
            <div className="card bg-ikori-surface">
              <p className="text-sm text-ikori-body">{q.explanation_en}</p>
              <p className="text-sm text-ikori-muted mt-1">{q.explanation_bn}</p>
            </div>
            <button onClick={nextQuestion} className="btn-green w-full">
              {currentIdx < questions.length - 1 ? "Next" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Results
  if (step === "results") {
    const stored = sessionStorage.getItem("ikori_trial_result");
    const result = stored ? JSON.parse(stored) : null;
    if (!result) return null;

    const band = getBand(result.weighted_score);

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-6">
          <Link href="/" className="text-lg font-display font-bold text-ikori-dark">
            iKORI <span className="text-ikori-500">N5</span>
          </Link>
        </div>

        {/* Readiness reveal */}
        <div className="bg-ikori-gradient rounded-ikori p-6 text-center mb-6 space-y-2">
          <p className="text-ikori-800 text-sm font-medium">Your readiness</p>
          <p className="text-5xl font-display font-bold text-ikori-900">{result.weighted_score}%</p>
          <div className={`inline-block px-4 py-2 rounded-ikori-full border ${band.color}`}>
            <p className="text-sm font-semibold">{band.label}</p>
          </div>
        </div>

        {/* Section scores */}
        <div className="card space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">Section Scores</h3>
          {[
            { label: "Vocabulary", score: result.section_scores.vocab },
            { label: "Grammar & Reading", score: result.section_scores.grammar_reading },
            { label: "Listening", score: result.section_scores.listening },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-ikori-body">{s.label}</span>
                <span className="text-ikori-dark font-medium">{s.score}%</span>
              </div>
              <div className="h-2 bg-ikori-100 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    s.score >= 60 ? "bg-ikori-500" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.min(s.score, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/signup?trial=1"
            className="btn-green w-full text-center block py-4"
          >
            Save my results & keep practising (free)
          </Link>
          <Link
            href="/n5/checkout?trial=1"
            className="btn-primary w-full text-center block py-4"
          >
            Unlock full access — ৳499/month
          </Link>
          <p className="text-xs text-ikori-muted text-center">
            🧪 Prototype: Both paths create a full account for testing
          </p>
        </div>
      </div>
    );
  }

  return null;
}
