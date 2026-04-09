import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminDb = createServiceRoleClient();

    const [
      { count: totalUsers },
      { data: activeUsers },
      { count: totalExams },
      { data: bandDistribution },
      { data: skillScores },
      { data: questionsBySection },
      { data: recentExams },
    ] = await Promise.all([
      adminDb.from("user_profiles").select("*", { count: "exact", head: true }),
      adminDb
        .from("user_profiles")
        .select("id")
        .gte("last_active", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      adminDb
        .from("exam_sessions")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted"),
      adminDb
        .from("exam_sessions")
        .select("readiness_band")
        .eq("status", "submitted")
        .not("readiness_band", "is", null),
      adminDb
        .from("user_skill_scores")
        .select("skill_tag, score"),
      adminDb
        .from("questions")
        .select("section, skill_tag"),
      adminDb
        .from("exam_sessions")
        .select("id, user_id, exam_type, weighted_score, readiness_band, submitted_at")
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(20),
    ]);

    // Aggregate band distribution
    const bands: Record<string, number> = { strong: 0, probable: 0, borderline: 0, high_risk: 0 };
    if (bandDistribution) {
      for (const row of bandDistribution) {
        const b = (row as { readiness_band: string }).readiness_band;
        if (b && bands[b] !== undefined) bands[b]++;
      }
    }

    // Aggregate skill scores (platform average)
    const skillAverages: Record<string, { total: number; count: number }> = {};
    if (skillScores) {
      for (const row of skillScores) {
        const r = row as { skill_tag: string; score: number };
        if (!skillAverages[r.skill_tag]) {
          skillAverages[r.skill_tag] = { total: 0, count: 0 };
        }
        skillAverages[r.skill_tag].total += r.score;
        skillAverages[r.skill_tag].count++;
      }
    }
    const skillAvgs: Record<string, number> = {};
    for (const [tag, data] of Object.entries(skillAverages)) {
      skillAvgs[tag] = data.count > 0 ? Math.round(data.total / data.count) : 0;
    }

    // Questions by section and skill_tag
    const sectionCounts: Record<string, number> = {};
    const skillTagCounts: Record<string, number> = {};
    if (questionsBySection) {
      for (const row of questionsBySection) {
        const r = row as { section: string; skill_tag: string };
        sectionCounts[r.section] = (sectionCounts[r.section] || 0) + 1;
        skillTagCounts[r.skill_tag] = (skillTagCounts[r.skill_tag] || 0) + 1;
      }
    }

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        active_7d: activeUsers?.length || 0,
      },
      exams: {
        total: totalExams || 0,
        band_distribution: bands,
      },
      skills: {
        averages: skillAvgs,
      },
      content: {
        questions_by_section: sectionCounts,
        questions_by_skill: skillTagCounts,
      },
      recent_exams: recentExams || [],
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
