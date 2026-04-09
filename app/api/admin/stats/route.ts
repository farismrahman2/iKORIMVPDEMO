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
      { count: totalQuestions },
      { count: validatedQuestions },
      { count: totalVocab },
      { count: validatedVocab },
      { count: questionsWithAudio },
      { count: totalUsers },
      { data: sectionBreakdown },
    ] = await Promise.all([
      adminDb.from("questions").select("*", { count: "exact", head: true }),
      adminDb.from("questions").select("*", { count: "exact", head: true }).eq("validated", true),
      adminDb.from("vocabulary").select("*", { count: "exact", head: true }),
      adminDb.from("vocabulary").select("*", { count: "exact", head: true }).eq("validated", true),
      adminDb.from("questions").select("*", { count: "exact", head: true }).not("audio_url", "is", null),
      adminDb.from("user_profiles").select("*", { count: "exact", head: true }),
      adminDb.from("questions").select("section"),
    ]);

    const questionsBySection: Record<string, number> = {};
    if (sectionBreakdown) {
      for (const row of sectionBreakdown) {
        const s = (row as { section: string }).section;
        questionsBySection[s] = (questionsBySection[s] || 0) + 1;
      }
    }

    return NextResponse.json({
      total_users: totalUsers || 0,
      total_questions: totalQuestions || 0,
      total_vocab: totalVocab || 0,
      validated_questions: validatedQuestions || 0,
      validated_vocab: validatedVocab || 0,
      questions_by_section: questionsBySection,
      questions_with_audio: questionsWithAudio || 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
