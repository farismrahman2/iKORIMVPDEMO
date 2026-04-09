"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Question, ReadinessBand } from "@/types";

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

type Step = "welcome" | "diagnostic" | "results" | "plan" | "done";

const BAND_CONFIG: Record<
  ReadinessBand,
  { label: string; color: string; bg: string }
> = {
  strong: { label: "Strong Pass", color: "text-ikori-700", bg: "bg-ikori-50" },
  probable: { label: "Probable Pass", color: "text-blue-700", bg: "bg-blue-50" },
  borderline: { label: "Borderline", color: "text-amber-700", bg: "bg-amber-50" },
  high_risk: { label: "High Risk", color: "text-red-700", bg: "bg-red-50" },
};

export default function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [results, setResults] = useState<{
    readiness_band: ReadinessBand;
    weighted_score: number;
    weak_skills: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  async function startDiagnostic() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_type: "diagnostic" }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        if (data.session?.id) {
          setSessionId(data.session.id);
        }
        setStep("diagnostic");
      }
    } catch {
      // If no questions available, skip diagnostic
      await finishOnboarding();
    }
    setLoading(false);
  }

  function selectAnswer(questionId: string, answerIdx: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIdx }));
  }

  async function submitDiagnostic() {
    setLoading(true);
    try {
      const responses = questions.map((q) => ({
        question_id: q.id,
        user_answer: answers[q.id] ?? null,
        time_taken_ms: 0,
      }));

      const res = await fetch("/api/sessions/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          responses,
        }),
      });

      const data = await res.json();
      setResults({
        readiness_band: data.readiness_band || "high_risk",
        weighted_score: data.weighted_score || 0,
        weak_skills: data.skill_scores
          ?.filter((s: { percentage: number }) => s.percentage < 60)
          .map((s: { skill_tag: string }) => s.skill_tag) || [],
      });
      setStep("results");
    } catch {
      setStep("results");
      setResults({
        readiness_band: "high_risk",
        weighted_score: 0,
        weak_skills: [],
      });
    }
    setLoading(false);
  }

  async function finishOnboarding() {
    await supabase
      .from("user_profiles")
      .update({ onboarded: true })
      .eq("id", userId);
    onComplete();
  }

  if (step === "welcome") {
    return (
      <div className="fixed inset-0 bg-ikori-white z-50 flex items-center justify-center px-4 sm:px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-display font-bold text-ikori-dark mb-2">
            Welcome to iKORI <span className="text-ikori-500">N5</span>
          </h1>
          <p className="text-ikori-muted mb-8">
            Let&apos;s find your starting level with a quick diagnostic test.
          </p>
          <div className="space-y-3">
            <div className="card text-left">
              <p className="text-sm text-ikori-body">
                <span className="text-ikori-500 font-semibold">20 questions</span> covering vocabulary, grammar, and listening
              </p>
            </div>
            <div className="card text-left">
              <p className="text-sm text-ikori-body">
                Takes about <span className="text-ikori-500 font-semibold">10 minutes</span>
              </p>
            </div>
            <div className="card text-left">
              <p className="text-sm text-ikori-body">
                We&apos;ll create a <span className="text-ikori-500 font-semibold">personalized study plan</span> based on your results
              </p>
            </div>
          </div>
          <button
            onClick={startDiagnostic}
            disabled={loading}
            className="btn-green w-full mt-8 disabled:opacity-50"
          >
            {loading ? "Preparing..." : "Start Diagnostic"}
          </button>
          <button
            onClick={finishOnboarding}
            className="btn-secondary w-full mt-3"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (step === "diagnostic") {
    const question = questions[currentIdx];
    if (!question) return null;

    const options = question.options as string[];
    const isLast = currentIdx === questions.length - 1;

    return (
      <div className="fixed inset-0 bg-ikori-white z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-ikori-muted mb-2">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="capitalize">{question.section.replace("_", " ")}</span>
            </div>
            <div className="h-2 bg-ikori-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-ikori-500 rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <p className="text-lg text-ikori-dark leading-relaxed font-medium">{question.question_text}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(question.id, idx)}
                className={`w-full text-left px-4 py-3 rounded-ikori-sm border transition-colors ${
                  answers[question.id] === idx
                    ? "border-ikori-500 bg-ikori-50 text-ikori-dark"
                    : "border-ikori-border bg-white text-ikori-body hover:border-ikori-300"
                }`}
              >
                <span className="font-medium mr-3 text-ikori-muted">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentIdx > 0 && (
              <button
                onClick={() => setCurrentIdx((i) => i - 1)}
                className="btn-secondary flex-1"
              >
                Previous
              </button>
            )}
            {isLast ? (
              <button
                onClick={submitDiagnostic}
                disabled={loading}
                className="btn-green flex-1 disabled:opacity-50"
              >
                {loading ? "Scoring..." : "Submit"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="btn-green flex-1"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "results" && results) {
    const bandConfig = BAND_CONFIG[results.readiness_band];

    return (
      <div className="fixed inset-0 bg-ikori-white z-50 flex items-center justify-center px-4 sm:px-6">
        <div className="text-center max-w-md w-full">
          <h2 className="text-2xl font-display font-bold text-ikori-dark mb-6">Your Starting Level</h2>

          <div className="bg-ikori-gradient rounded-ikori p-8 mb-6 space-y-3">
            <p className="text-ikori-900 text-4xl font-display font-bold">
              {Math.round(results.weighted_score)}%
            </p>
            <div className="inline-block bg-white/60 backdrop-blur-sm rounded-ikori-full px-4 py-2">
              <p className="text-ikori-800 text-sm font-semibold">
                {bandConfig.label}
              </p>
            </div>
          </div>

          {results.weak_skills.length > 0 && (
            <div className="card mb-6 text-left">
              <p className="text-sm text-ikori-muted mb-2">Areas to focus on:</p>
              <div className="flex flex-wrap gap-2">
                {results.weak_skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-ikori-full text-xs font-medium"
                  >
                    {skill.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep("plan")}
            className="btn-green w-full"
          >
            See Your Study Plan
          </button>
        </div>
      </div>
    );
  }

  if (step === "plan") {
    return (
      <div className="fixed inset-0 bg-ikori-white z-50 flex items-center justify-center px-4 sm:px-6">
        <div className="text-center max-w-md w-full">
          <h2 className="text-2xl font-display font-bold text-ikori-dark mb-6">Your 3-Day Kickstart Plan</h2>

          <div className="space-y-4 mb-8 text-left">
            {["Day 1", "Day 2", "Day 3"].map((day, i) => (
              <div key={day} className="card">
                <p className="font-display font-semibold text-ikori-500 mb-2">{day}</p>
                <ul className="text-sm text-ikori-body space-y-1">
                  {i === 0 && (
                    <>
                      <li>Review 15 flashcards</li>
                      <li>Vocabulary drill (10 questions)</li>
                      <li>Listen to 5 audio clips</li>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <li>Review 15 flashcards</li>
                      <li>Grammar practice (10 questions)</li>
                      <li>Vocabulary: recognition mode</li>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <li>Review 15 flashcards</li>
                      <li>Section mock: weakest area</li>
                      <li>Review wrong answers</li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <button
            onClick={finishOnboarding}
            className="btn-green w-full"
          >
            Start Learning
          </button>
        </div>
      </div>
    );
  }

  return null;
}
