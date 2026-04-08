"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import ExamTimer from "@/components/exam/ExamTimer";
import QuestionCard from "@/components/exam/QuestionCard";
import ProgressBar from "@/components/exam/ProgressBar";
import type { Question, ExamBlueprint } from "@/types";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";

interface Answer {
  question_id: string;
  user_answer: number | null;
  time_taken_ms: number;
}

export default function ExamSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadSession() {
      const { data: session } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session) {
        router.push("/exam");
        return;
      }

      // Fetch questions through the API — for now get from session data
      const res = await fetch("/api/questions/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_type: session.exam_type,
          section_filter: session.section_filter,
          user_id: session.user_id,
        }),
      });

      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setBlueprint(data.blueprint);
      }
      setLoading(false);
    }

    loadSession();
  }, [sessionId, router, supabase]);

  const submitExam = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    // Record time for current question
    const finalAnswers = { ...answers };
    const currentQ = questions[currentIdx];
    if (currentQ && !finalAnswers[currentQ.id]) {
      finalAnswers[currentQ.id] = {
        question_id: currentQ.id,
        user_answer: null,
        time_taken_ms: Date.now() - questionStartTime,
      };
    }

    const responses = questions.map((q) => ({
      question_id: q.id,
      user_answer: finalAnswers[q.id]?.user_answer ?? null,
      time_taken_ms: finalAnswers[q.id]?.time_taken_ms ?? 0,
    }));

    try {
      await fetch("/api/sessions/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, responses }),
      });

      router.push(`/exam/results/${sessionId}`);
    } catch {
      setSubmitting(false);
    }
  }, [submitting, answers, questions, currentIdx, questionStartTime, sessionId, router]);

  function selectAnswer(answerIdx: number) {
    const question = questions[currentIdx];
    if (!question) return;

    const timeTaken = Date.now() - questionStartTime;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        question_id: question.id,
        user_answer: answerIdx,
        time_taken_ms: timeTaken,
      },
    }));
  }

  function skipQuestion() {
    const question = questions[currentIdx];
    if (!question) return;

    const timeTaken = Date.now() - questionStartTime;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        question_id: question.id,
        user_answer: null,
        time_taken_ms: timeTaken,
      },
    }));

    if (currentIdx < questions.length - 1) {
      goToNext();
    }
  }

  function toggleFlag() {
    const question = questions[currentIdx];
    if (!question) return;

    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  }

  function goToNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setQuestionStartTime(Date.now());
    }
  }

  function goToPrev() {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setQuestionStartTime(Date.now());
    }
  }

  function getCurrentSection() {
    const question = questions[currentIdx];
    return question?.section;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading exam...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-400 mb-4">No questions available for this exam.</p>
        <button
          onClick={() => router.push("/exam")}
          className="px-6 py-2 bg-accent-orange rounded-lg text-white"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  const question = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="px-4 py-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <ExamTimer
          totalSeconds={blueprint?.time_limit_sec || 4500}
          onTimeUp={submitExam}
        />
        <button
          onClick={toggleFlag}
          className={`p-2 rounded-lg transition-colors ${
            flagged.has(question.id)
              ? "text-accent-gold bg-accent-gold/10"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Flag size={18} />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          current={currentIdx + 1}
          total={questions.length}
          currentSection={getCurrentSection()}
          sections={blueprint?.sections}
        />
      </div>

      {/* Question */}
      <QuestionCard
        question={question}
        selectedAnswer={answers[question.id]?.user_answer ?? null}
        onSelect={selectAnswer}
        onSkip={skipQuestion}
      />

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={goToPrev}
          disabled={currentIdx === 0}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg border border-navy-lighter text-gray-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        {currentIdx === questions.length - 1 ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="flex-1 py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            Next
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Answered count */}
      <p className="text-center text-gray-500 text-sm mt-4">
        {answeredCount} of {questions.length} answered
        {flagged.size > 0 && ` | ${flagged.size} flagged`}
      </p>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-navy-light rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Submit Exam?</h3>
            <p className="text-gray-400 text-sm mb-4">
              You&apos;ve answered {answeredCount} of {questions.length} questions.
              {questions.length - answeredCount > 0 && (
                <span className="text-accent-gold">
                  {" "}
                  {questions.length - answeredCount} unanswered.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-navy-lighter text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  submitExam();
                }}
                className="flex-1 py-2 rounded-lg bg-accent-orange text-white font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
