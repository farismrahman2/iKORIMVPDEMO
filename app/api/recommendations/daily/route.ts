import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Mission, DailyRecommendation, SkillTag } from "@/types";

const VOCAB_SKILLS: SkillTag[] = ["kana_recognition", "kanji_reading", "word_meaning", "vocab_usage"];
const GRAMMAR_SKILLS: SkillTag[] = ["particle", "verb_form", "adjective_form", "sentence_completion", "sentence_order", "short_reading", "notice_reading"];
const LISTENING_SKILLS: SkillTag[] = ["listening_gist", "listening_detail", "listening_response", "listening_sequence"];

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get weak areas sorted by score (worst first)
    const { data: weakAreas } = await supabase
      .from("user_weak_areas")
      .select("*")
      .eq("user_id", user.id)
      .order("score", { ascending: true });

    // Get user skill scores for section-level assessment
    const { data: skillScores } = await supabase
      .from("user_skill_scores")
      .select("*")
      .eq("user_id", user.id);

    const weakSkills: SkillTag[] = (weakAreas || [])
      .slice(0, 3)
      .map((w: { skill_tag: string }) => w.skill_tag as SkillTag);

    const missions: Mission[] = [];
    let missionId = 0;

    // Always recommend flashcards
    missions.push({
      id: `mission-${missionId++}`,
      type: "flashcards",
      title: "Review Flashcards",
      description: "Review due flashcards to strengthen vocabulary retention",
      skill_tags: ["word_meaning", "kana_recognition"],
      question_count: 15,
      estimated_minutes: 10,
      completed: false,
    });

    // Add weak skill drills
    const weakVocab = weakSkills.filter((s) => VOCAB_SKILLS.includes(s));
    const weakGrammar = weakSkills.filter((s) => GRAMMAR_SKILLS.includes(s));
    const weakListening = weakSkills.filter((s) => LISTENING_SKILLS.includes(s));

    if (weakVocab.length > 0) {
      missions.push({
        id: `mission-${missionId++}`,
        type: "vocab_drill",
        title: "Vocabulary Drill",
        description: `Focus on: ${weakVocab.join(", ").replace(/_/g, " ")}`,
        skill_tags: weakVocab,
        question_count: 10,
        estimated_minutes: 8,
        completed: false,
      });
    }

    if (weakGrammar.length > 0) {
      missions.push({
        id: `mission-${missionId++}`,
        type: "grammar_drill",
        title: "Grammar Drill",
        description: `Focus on: ${weakGrammar.join(", ").replace(/_/g, " ")}`,
        skill_tags: weakGrammar,
        question_count: 10,
        estimated_minutes: 10,
        completed: false,
      });
    }

    if (weakListening.length > 0) {
      missions.push({
        id: `mission-${missionId++}`,
        type: "listening_quiz",
        title: "Listening Practice",
        description: `Focus on: ${weakListening.join(", ").replace(/_/g, " ")}`,
        skill_tags: weakListening,
        question_count: 8,
        estimated_minutes: 12,
        completed: false,
      });
    }

    // Check if any section average is below 60% — recommend section mock
    const sectionAvgs = {
      vocab: calculateSectionAvg(skillScores || [], VOCAB_SKILLS),
      grammar: calculateSectionAvg(skillScores || [], GRAMMAR_SKILLS),
      listening: calculateSectionAvg(skillScores || [], LISTENING_SKILLS),
    };

    if (sectionAvgs.vocab < 60 || sectionAvgs.grammar < 60 || sectionAvgs.listening < 60) {
      const weakestSection =
        sectionAvgs.vocab <= sectionAvgs.grammar && sectionAvgs.vocab <= sectionAvgs.listening
          ? "vocab"
          : sectionAvgs.grammar <= sectionAvgs.listening
          ? "grammar_reading"
          : "listening";

      missions.push({
        id: `mission-${missionId++}`,
        type: "mock_exam",
        title: `${weakestSection.replace("_", " ")} Section Mock`,
        description: "Take a section mock to assess your progress",
        skill_tags: weakSkills,
        question_count: weakestSection === "vocab" ? 25 : weakestSection === "grammar_reading" ? 30 : 20,
        estimated_minutes: 20,
        completed: false,
      });
    }

    const recommendation: DailyRecommendation = {
      missions,
      weak_skills: weakSkills,
      estimated_total_minutes: missions.reduce((sum, m) => sum + m.estimated_minutes, 0),
    };

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

function calculateSectionAvg(
  scores: { skill_tag: string; score: number }[],
  sectionSkills: SkillTag[]
): number {
  const relevant = scores.filter((s) => sectionSkills.includes(s.skill_tag as SkillTag));
  if (relevant.length === 0) return 0;
  return relevant.reduce((sum, s) => sum + s.score, 0) / relevant.length;
}
