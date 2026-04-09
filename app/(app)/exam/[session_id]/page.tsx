"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
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
  const { t } = useLanguage();
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

      // Assemble questions for this session
      // Note: questions are assembled fresh per page load. For production,
      // consider storing question IDs with the session to preserve exam state.
      const res = await fetch("/api/questions/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_type: session.exam_type,
          section_filter: session.section_filter,
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
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted">{t('loading')}</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-ikori-white">
        <p className="text-ikori-muted mb-4">{t('error')}</p>
        <button
          onClick={() => router.push("/exam")}
          className="btn-primary"
        >
          {t('back')}
        </button>
      </div>
    );
  }

  const question = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-ikori-white">
      {/* Sticky timer header */}
      <div className="sticky top-0 z-40 bg-white border-b border-ikori-border px-4 py-3">
        <div className="flex items-center justify-between">
          <ExamTimer
            totalSeconds={blueprint?.time_limit_sec || 4500}
            onTimeUp={submitExam}
          />
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1 p-2 rounded-ikori-sm transition-colors text-xs ${
              flagged.has(question.id)
                ? "text-amber-500 bg-amber-50"
                : "text-ikori-muted hover:text-ikori-body"
            }`}
          >
            <Flag size={18} />
            <span className="hidden sm:inline">{flagged.has(question.id) ? t('flagged') : t('flag_review')}</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
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
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-full border border-ikori-border text-ikori-body hover:text-ikori-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            {t('previous')}
          </button>

          {currentIdx === questions.length - 1 ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex-1 py-3 rounded-full bg-ikori-500 text-white font-semibold hover:bg-ikori-600 transition-colors disabled:opacity-50"
            >
              {submitting ? `${t('submit')}...` : t('submit')}
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-full bg-ikori-500 text-white font-semibold hover:bg-ikori-600 transition-colors"
            >
              {t('next')}
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Answered count */}
        <p className="text-center text-ikori-muted text-sm mt-4">
          {t('answered_of', { done: answeredCount, total: questions.length })}
          {flagged.size > 0 && ` | ${t('n_flagged', { count: flagged.size })}`}
        </p>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-ikori shadow-ikori-md p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-ikori-dark mb-2">{t('confirm_submit')}</h3>
            <p className="text-ikori-body text-sm mb-4">
              {questions.length - answeredCount > 0 && (
                <span className="text-amber-500 font-medium">
                  {t('unanswered_warning', { count: questions.length - answeredCount })}
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  submitExam();
                }}
                className="flex-1 py-3 rounded-full bg-ikori-500 text-white font-semibold hover:bg-ikori-600 transition-colors"
              >
                {t('yes_submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
