import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { scoreExam } from "@/lib/scoring-engine";
import { runDiagnostic } from "@/lib/diagnostic";
import type { ScoreRequest, ExamResponse, Question } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ScoreRequest = await request.json();
    const { session_id, responses } = body;

    if (!session_id || !responses) {
      return NextResponse.json(
        { error: "session_id and responses are required" },
        { status: 400 }
      );
    }

    // Verify session ownership
    const { data: session } = await supabase
      .from("exam_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get questions for this session
    const questionIds = responses.map((r) => r.question_id);
    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .in("id", questionIds);

    if (!questions) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    const questionMap = new Map(questions.map((q: Question) => [q.id, q]));

    // Build exam responses with correctness
    const examResponses: ExamResponse[] = responses.map((r) => {
      const question = questionMap.get(r.question_id);
      return {
        id: "",
        session_id,
        question_id: r.question_id,
        user_answer: r.user_answer,
        is_correct: question ? r.user_answer === question.correct_answer : false,
        time_taken_ms: r.time_taken_ms,
        skill_tag: question?.skill_tag || "word_meaning",
        difficulty: question?.difficulty || "medium",
      };
    });

    // Save responses to database
    await supabase.from("exam_responses").insert(
      examResponses.map((r) => ({
        session_id: r.session_id,
        question_id: r.question_id,
        user_answer: r.user_answer,
        is_correct: r.is_correct,
        time_taken_ms: r.time_taken_ms,
        skill_tag: r.skill_tag,
        difficulty: r.difficulty,
      }))
    );

    // Score the exam
    const result = scoreExam(session_id, examResponses, questions as Question[]);

    // Update session with scores
    await supabase
      .from("exam_sessions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        vocab_score: result.section_scores.vocab,
        grammar_score: result.section_scores.grammar_reading,
        listening_score: result.section_scores.listening,
        overall_score: result.overall_score,
        weighted_score: result.weighted_score,
        readiness_band: result.readiness_band,
      })
      .eq("id", session_id);

    // Run diagnostic to update skill scores and weak areas
    await runDiagnostic(
      supabase,
      user.id,
      result.skill_scores,
      result.weighted_score
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scoring session:", error);
    return NextResponse.json(
      { error: "Failed to score session" },
      { status: 500 }
    );
  }
}
