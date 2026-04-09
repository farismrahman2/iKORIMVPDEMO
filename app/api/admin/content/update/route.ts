import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, id, updates } = (await request.json()) as {
      type: "vocabulary" | "questions";
      id: string;
      updates: Record<string, unknown>;
    };

    if (!type || !id || !updates) {
      return NextResponse.json(
        { error: "type, id, and updates are required" },
        { status: 400 }
      );
    }

    // Sanitize: only allow known fields
    const allowedVocab = [
      "word", "kana", "kanji", "meaning_en", "meaning_bn",
      "example_sentence_jp", "example_sentence_bn", "audio_url",
      "category", "difficulty", "frequency_tier", "validated",
    ];
    const allowedQuestions = [
      "section", "subtype", "difficulty", "topic", "skill_tag",
      "frequency_tier", "question_text", "options", "correct_answer",
      "explanation_en", "explanation_bn", "audio_url", "audio_script",
      "distractor_logic", "source_type", "validated",
    ];

    const allowed = type === "vocabulary" ? allowedVocab : allowedQuestions;
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        sanitized[key] = updates[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const adminDb = createServiceRoleClient();
    const table = type === "vocabulary" ? "vocabulary" : "questions";

    const { data, error } = await adminDb
      .from(table)
      .update(sanitized)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
