"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { getSkillLabel } from "@/lib/i18n";
import ResultsBand from "@/components/exam/ResultsBand";
import QuestionCard from "@/components/exam/QuestionCard";
import type { ExamSession, ExamResponse, Question, SkillTag, ReadinessBand } from "@/types";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const sessionId = params.session_id as string;

  const [session, setSession] = useState<ExamSession | null>(null);
  const [responses, setResponses] = useState<ExamResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [skillScores, setSkillScores] = useState<
    { skill_tag: SkillTag; percentage: number }[]
  >([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadResults() {
      // Load session
      const { data: sessionData } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!sessionData) {
        router.push("/exam");
        return;
      }
      setSession(sessionData as ExamSession);

      // Load responses
      const { data: responsesData } = await supabase
        .from("exam_responses")
        .select("*")
        .eq("session_id", sessionId);

      if (responsesData) {
        setResponses(responsesData as ExamResponse[]);

        // Load questions
        const questionIds = responsesData.map(
          (r: ExamResponse) => r.question_id
        );
        if (questionIds.length > 0) {
          const { data: questionsData } = await supabase
            .from("questions")
            .select("*")
            .in("id", questionIds);

          if (questionsData) {
            setQuestions(questionsData as Question[]);
          }
        }
      }

      // Load skill scores
      const { data: scores } = await supabase
        .from("user_skill_scores")
        .select("*")
        .eq("user_id", sessionData.user_id);

      if (scores) {
        setSkillScores(
          scores
            .map((s: { skill_tag: string; score: number }) => ({
              skill_tag: s.skill_tag as SkillTag,
              percentage: s.score,
            }))
            .sort(
              (a: { percentage: number }, b: { percentage: number }) =>
                a.percentage - b.percentage
            )
        );
      }

      // Fire-and-forget mission completion
      fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_type: sessionData.exam_type === 'full' ? 'mock_exam' : 'weak_skill_drill',
        }),
      }).catch(() => {});

      setLoading(false);
    }

    loadResults();
  }, [sessionId, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted">{t('loading')}</div>
      </div>
    );
  }

  if (!session) return null;

  // Wrong answers for review
  const wrongResponses = responses.filter((r) => !r.is_correct && r.user_answer !== null);
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  if (reviewMode) {
    const response = wrongResponses[reviewIdx];
    const question = response ? questionMap.get(response.question_id) : null;

    if (!question) {
      setReviewMode(false);
      return null;
    }

    return (
      <div className="px-4 py-6 bg-ikori-white min-h-screen">
        <button
          onClick={() => setReviewMode(false)}
          className="flex items-center gap-1 text-ikori-muted hover:text-ikori-dark mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          {t('back_results')}
        </button>

        <div className="mb-4">
          <p className="text-sm text-ikori-muted">
            {t('wrong_answer', { n: reviewIdx + 1, total: wrongResponses.length })}
          </p>
          <div className="h-[3px] bg-ikori-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-ikori-500 rounded-full transition-all duration-300"
              style={{
                width: `${((reviewIdx + 1) / wrongResponses.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <QuestionCard
          question={question}
          selectedAnswer={response.user_answer}
          onSelect={() => {}}
          onSkip={() => {}}
          showResult
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setReviewIdx((i) => Math.max(0, i - 1))}
            disabled={reviewIdx === 0}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-full border border-ikori-border text-ikori-body disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
            {t('previous')}
          </button>
          <button
            onClick={() =>
              setReviewIdx((i) => Math.min(wrongResponses.length - 1, i + 1))
            }
            disabled={reviewIdx === wrongResponses.length - 1}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-full bg-ikori-500 text-white font-semibold disabled:opacity-30 transition-colors"
          >
            {t('next')}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-display font-bold text-ikori-dark mb-6">{t('exam_results')}</h1>

      <ResultsBand
        readinessBand={(session.readiness_band || "high_risk") as ReadinessBand}
        weightedScore={session.weighted_score || 0}
        sectionScores={{
          vocab: session.vocab_score || 0,
          grammar_reading: session.grammar_score || 0,
          listening: session.listening_score || 0,
        }}
      />

      {/* Skill breakdown */}
      {skillScores.length > 0 && (
        <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 mt-6">
          <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide mb-3">
            {t('skill_breakdown')}
          </h3>
          <div className="space-y-2">
            {skillScores.map((skill) => (
              <div key={skill.skill_tag} className="flex items-center gap-3">
                <span
                  className={`text-sm flex-1 ${
                    skill.percentage < 60 ? "text-red-500" : "text-ikori-body"
                  }`}
                >
                  {getSkillLabel(skill.skill_tag, lang)}
                </span>
                <span
                  className={`text-sm font-medium ${
                    skill.percentage < 60
                      ? "text-red-500"
                      : skill.percentage >= 80
                      ? "text-ikori-500"
                      : "text-ikori-body"
                  }`}
                >
                  {Math.round(skill.percentage)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3 mt-6">
        {wrongResponses.length > 0 && (
          <button
            onClick={() => {
              setReviewMode(true);
              setReviewIdx(0);
            }}
            className="btn-secondary w-full"
          >
            {t('review_wrong', { count: wrongResponses.length })}
          </button>
        )}

        <button
          onClick={() => router.push("/exam")}
          className="btn-green w-full"
        >
          {t('take_another')}
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="btn-secondary w-full"
        >
          {t('back_dashboard')}
        </button>
      </div>
    </div>
  );
}
