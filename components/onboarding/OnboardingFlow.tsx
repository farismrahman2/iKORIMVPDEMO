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
  strong: { label: "Strong Pass", color: "text-band-strong", bg: "bg-band-strong/20" },
  probable: { label: "Probable Pass", color: "text-band-probable", bg: "bg-band-probable/20" },
  borderline: { label: "Borderline", color: "text-band-borderline", bg: "bg-band-borderline/20" },
  high_risk: { label: "High Risk", color: "text-band-high_risk", bg: "bg-band-high_risk/20" },
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
      <div className="fixed inset-0 bg-navy z-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to iKORI <span className="text-accent-orange">N5</span>
          </h1>
          <p className="text-gray-400 mb-8">
            Let&apos;s find your starting level with a quick diagnostic test.
          </p>
          <div className="space-y-3">
            <div className="bg-navy-light rounded-lg p-4 text-left">
              <p className="text-sm text-gray-300">
                <span className="text-accent-gold font-semibold">20 questions</span> covering vocabulary, grammar, and listening
              </p>
            </div>
            <div className="bg-navy-light rounded-lg p-4 text-left">
              <p className="text-sm text-gray-300">
                Takes about <span className="text-accent-gold font-semibold">10 minutes</span>
              </p>
            </div>
            <div className="bg-navy-light rounded-lg p-4 text-left">
              <p className="text-sm text-gray-300">
                We&apos;ll create a <span className="text-accent-gold font-semibold">personalized study plan</span> based on your results
              </p>
            </div>
          </div>
          <button
            onClick={startDiagnostic}
            disabled={loading}
            className="w-full mt-8 py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Preparing..." : "Start Diagnostic"}
          </button>
          <button
            onClick={finishOnboarding}
            className="w-full mt-3 py-3 rounded-lg border border-navy-lighter text-gray-400 hover:text-white transition-colors"
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
      <div className="fixed inset-0 bg-navy z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="capitalize">{question.section.replace("_", " ")}</span>
            </div>
            <div className="h-2 bg-navy-light rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-orange rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <p className="text-lg text-white leading-relaxed">{question.question_text}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(question.id, idx)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  answers[question.id] === idx
                    ? "border-accent-orange bg-accent-orange/10 text-white"
                    : "border-navy-lighter bg-navy-light text-gray-300 hover:border-gray-500"
                }`}
              >
                <span className="font-medium mr-3 text-gray-500">
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
                className="flex-1 py-3 rounded-lg border border-navy-lighter text-gray-300 hover:text-white transition-colors"
              >
                Previous
              </button>
            )}
            {isLast ? (
              <button
                onClick={submitDiagnostic}
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Scoring..." : "Submit"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="flex-1 py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors"
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
      <div className="fixed inset-0 bg-navy z-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6">Your Starting Level</h2>

          <div className={`${bandConfig.bg} rounded-2xl p-8 mb-6`}>
            <p className={`text-4xl font-bold ${bandConfig.color}`}>
              {Math.round(results.weighted_score)}%
            </p>
            <p className={`text-lg font-semibold mt-2 ${bandConfig.color}`}>
              {bandConfig.label}
            </p>
          </div>

          {results.weak_skills.length > 0 && (
            <div className="bg-navy-light rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-400 mb-2">Areas to focus on:</p>
              <div className="flex flex-wrap gap-2">
                {results.weak_skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-band-high_risk/20 text-band-high_risk rounded-full text-xs"
                  >
                    {skill.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep("plan")}
            className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            See Your Study Plan
          </button>
        </div>
      </div>
    );
  }

  if (step === "plan") {
    return (
      <div className="fixed inset-0 bg-navy z-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6">Your 3-Day Kickstart Plan</h2>

          <div className="space-y-4 mb-8 text-left">
            {["Day 1", "Day 2", "Day 3"].map((day, i) => (
              <div key={day} className="bg-navy-light rounded-lg p-4">
                <p className="font-semibold text-accent-gold mb-2">{day}</p>
                <ul className="text-sm text-gray-300 space-y-1">
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
            className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </div>
    );
  }

  return null;
}
