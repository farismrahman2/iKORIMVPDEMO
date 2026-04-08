"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import ResultsBand from "@/components/exam/ResultsBand";
import QuestionCard from "@/components/exam/QuestionCard";
import type { ExamSession, ExamResponse, Question, SkillTag, ReadinessBand } from "@/types";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
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

      setLoading(false);
    }

    loadResults();
  }, [sessionId, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading results...</div>
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
      <div className="px-4 py-6">
        <button
          onClick={() => setReviewMode(false)}
          className="flex items-center gap-1 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft size={18} />
          Back to Results
        </button>

        <div className="mb-4">
          <p className="text-sm text-gray-400">
            Wrong Answer {reviewIdx + 1} of {wrongResponses.length}
          </p>
          <div className="h-1 bg-navy-light rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-accent-orange rounded-full"
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
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg border border-navy-lighter text-gray-300 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <button
            onClick={() =>
              setReviewIdx((i) => Math.min(wrongResponses.length - 1, i + 1))
            }
            disabled={reviewIdx === wrongResponses.length - 1}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-accent-orange text-white disabled:opacity-30"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Exam Results</h1>

      <ResultsBand
        readinessBand={(session.readiness_band as ReadinessBand) || "high_risk"}
        weightedScore={session.weighted_score || 0}
        sectionScores={{
          vocab: session.vocab_score || 0,
          grammar_reading: session.grammar_score || 0,
          listening: session.listening_score || 0,
        }}
      />

      {/* Skill breakdown */}
      {skillScores.length > 0 && (
        <div className="bg-navy-light rounded-xl p-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Skills Breakdown
          </h3>
          <div className="space-y-2">
            {skillScores.map((skill) => (
              <div key={skill.skill_tag} className="flex items-center gap-3">
                <span
                  className={`text-sm flex-1 ${
                    skill.percentage < 60 ? "text-band-high_risk" : "text-gray-300"
                  }`}
                >
                  {skill.skill_tag.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-sm font-medium ${
                    skill.percentage < 60
                      ? "text-band-high_risk"
                      : skill.percentage >= 80
                      ? "text-band-strong"
                      : "text-gray-300"
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
            className="w-full py-3 rounded-lg border border-accent-orange text-accent-orange font-semibold hover:bg-accent-orange/10 transition-colors"
          >
            Review Wrong Answers ({wrongResponses.length})
          </button>
        )}

        <button
          onClick={() => router.push("/exam")}
          className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          Take Another Mock
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 rounded-lg border border-navy-lighter text-gray-300 hover:text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
