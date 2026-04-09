import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { SkillScore, SkillTag } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Always use authenticated user's ID — never trust body
    const userId = user.id;

    // Get current skill scores
    const { data: skillScores } = await supabase
      .from("user_skill_scores")
      .select("*")
      .eq("user_id", userId);

    // Get weak areas
    const { data: weakAreas } = await supabase
      .from("user_weak_areas")
      .select("*")
      .eq("user_id", userId);

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const skills: SkillScore[] = (skillScores || []).map(
      (s: { skill_tag: string; score: number; attempts: number }) => ({
        skill_tag: s.skill_tag as SkillTag,
        correct: Math.round((s.score / 100) * s.attempts),
        total: s.attempts,
        percentage: s.score,
      })
    );

    return NextResponse.json({
      skill_scores: skills,
      weak_areas: weakAreas || [],
      pass_probability: profile?.pass_probability || 0,
      readiness_band: profile?.readiness_band || "high_risk",
      recommendations: generateRecommendations(skills, weakAreas || []),
    });
  } catch (error) {
    console.error("Error running diagnostic:", error);
    return NextResponse.json(
      { error: "Failed to run diagnostic" },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  skills: SkillScore[],
  weakAreas: { skill_tag: string; score: number }[]
) {
  const weakSkills = weakAreas
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((w) => w.skill_tag);

  return {
    focus_skills: weakSkills,
    suggested_activities: [
      ...(weakSkills.some((s) =>
        ["kana_recognition", "kanji_reading", "word_meaning", "vocab_usage"].includes(s)
      )
        ? [{ type: "vocab_drill", skill_tags: weakSkills.filter((s) =>
            ["kana_recognition", "kanji_reading", "word_meaning", "vocab_usage"].includes(s)
          )}]
        : []),
      ...(weakSkills.some((s) =>
        ["particle", "verb_form", "adjective_form", "sentence_completion", "sentence_order"].includes(s)
      )
        ? [{ type: "grammar_drill", skill_tags: weakSkills.filter((s) =>
            ["particle", "verb_form", "adjective_form", "sentence_completion", "sentence_order"].includes(s)
          )}]
        : []),
      ...(weakSkills.some((s) =>
        ["listening_gist", "listening_detail", "listening_response", "listening_sequence"].includes(s)
      )
        ? [{ type: "listening_quiz", skill_tags: weakSkills.filter((s) =>
            ["listening_gist", "listening_detail", "listening_response", "listening_sequence"].includes(s)
          )}]
        : []),
    ],
  };
}
