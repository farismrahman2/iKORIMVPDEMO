import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { generateSpeech } from "@/lib/elevenlabs";
import { uploadAudio } from "@/lib/audio-storage";

// Vercel free tier has 10s timeout — process ONE question per request.
// The client chains requests for bulk generation.

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { question_ids, speaker = "female" } = (await request.json()) as {
      question_ids: string[];
      speaker?: "male" | "female" | "dialogue";
    };

    if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      return NextResponse.json(
        { error: "question_ids array is required" },
        { status: 400 }
      );
    }

    // Only process the FIRST question to stay within Vercel 10s timeout
    const questionId = question_ids[0];
    const adminDb = createServiceRoleClient();

    const { data: question, error: fetchError } = await adminDb
      .from("questions")
      .select("id, question_text, audio_script, options")
      .eq("id", questionId)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const text = question.audio_script || question.question_text;
    if (!text) {
      return NextResponse.json({
        processed: 1,
        success: 0,
        failed: 1,
        results: [{ question_id: questionId, status: "skipped", error: "No audio script" }],
      });
    }

    try {
      const audioBuffer = await generateSpeech(text, speaker);
      const audioUrl = await uploadAudio(audioBuffer, question.id, speaker);

      // Update question with audio URL
      await adminDb
        .from("questions")
        .update({ audio_url: audioUrl })
        .eq("id", question.id);

      return NextResponse.json({
        processed: 1,
        success: 1,
        failed: 0,
        results: [{ question_id: question.id, status: "uploaded", audio_url: audioUrl }],
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({
        processed: 1,
        success: 0,
        failed: 1,
        results: [{ question_id: question.id, status: "error", error: errorMsg }],
      });
    }
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: "Audio generation failed" },
      { status: 500 }
    );
  }
}
