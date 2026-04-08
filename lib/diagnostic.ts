import type { SkillScore, ReadinessBand, SkillTag } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { determineReadinessBand } from "./scoring-engine";

const WEAK_THRESHOLD = 60;
const STRONG_THRESHOLD = 80;

export interface DiagnosticResult {
  weak_areas: { skill_tag: SkillTag; score: number }[];
  strong_areas: { skill_tag: SkillTag; score: number }[];
  pass_probability: number;
  readiness_band: ReadinessBand;
}

export async function runDiagnostic(
  supabase: SupabaseClient,
  userId: string,
  skillScores: SkillScore[],
  weightedScore: number
): Promise<DiagnosticResult> {
  const weakAreas = skillScores
    .filter((s) => s.percentage < WEAK_THRESHOLD)
    .map((s) => ({ skill_tag: s.skill_tag, score: s.percentage }));

  const strongAreas = skillScores
    .filter((s) => s.percentage >= STRONG_THRESHOLD)
    .map((s) => ({ skill_tag: s.skill_tag, score: s.percentage }));

  const passProbability = Math.min(100, Math.max(0, weightedScore));
  const readinessBand = determineReadinessBand(weightedScore);

  // Update user_skill_scores
  for (const skill of skillScores) {
    await supabase
      .from("user_skill_scores")
      .upsert(
        {
          user_id: userId,
          skill_tag: skill.skill_tag,
          score: skill.percentage,
          attempts: skill.total,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,skill_tag" }
      );
  }

  // Update user_weak_areas — clear old and insert new
  await supabase
    .from("user_weak_areas")
    .delete()
    .eq("user_id", userId);

  if (weakAreas.length > 0) {
    await supabase.from("user_weak_areas").insert(
      weakAreas.map((w) => ({
        user_id: userId,
        skill_tag: w.skill_tag,
        score: w.score,
        flagged_at: new Date().toISOString(),
      }))
    );
  }

  // Update user profile
  await supabase
    .from("user_profiles")
    .update({
      pass_probability: passProbability,
      readiness_band: readinessBand,
      last_active: new Date().toISOString(),
    })
    .eq("id", userId);

  return {
    weak_areas: weakAreas,
    strong_areas: strongAreas,
    pass_probability: passProbability,
    readiness_band: readinessBand,
  };
}
