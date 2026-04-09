import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { generateSpeech } from "@/lib/elevenlabs";
import { uploadAudio } from "@/lib/audio-storage";

const MAX_PER_REQUEST = 10;

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

    const ids = question_ids.slice(0, MAX_PER_REQUEST);
    const adminDb = createServiceRoleClient();

    // Fetch questions
    const { data: questions, error: fetchError } = await adminDb
      .from("questions")
      .select("id, question_text, audio_script, options")
      .in("id", ids);

    if (fetchError || !questions) {
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    const results: { question_id: string; status: string; audio_url?: string; error?: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const q of questions) {
      const text = q.audio_script || q.question_text;
      if (!text) {
        results.push({ question_id: q.id, status: "skipped", error: "No audio script or question text" });
        failed++;
        continue;
      }

      // Log start
      await adminDb.from("audio_generation_log").insert({
        question_id: q.id,
        audio_script: text,
        speaker,
        status: "generating",
        generated_by: user.id,
      });

      try {
        const audioBuffer = await generateSpeech(text, speaker);
        const audioUrl = await uploadAudio(audioBuffer, q.id, speaker);

        // Update question with audio URL
        await adminDb
          .from("questions")
          .update({ audio_url: audioUrl })
          .eq("id", q.id);

        // Update log
        await adminDb
          .from("audio_generation_log")
          .update({ status: "uploaded", audio_url: audioUrl })
          .eq("question_id", q.id)
          .eq("status", "generating");

        results.push({ question_id: q.id, status: "uploaded", audio_url: audioUrl });
        success++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await adminDb
          .from("audio_generation_log")
          .update({ status: "error", error_message: errorMsg })
          .eq("question_id", q.id)
          .eq("status", "generating");

        results.push({ question_id: q.id, status: "error", error: errorMsg });
        failed++;
      }

      // Rate limiting: 1 second delay between ElevenLabs calls
      if (questions.indexOf(q) < questions.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      processed: results.length,
      success,
      failed,
      results,
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: "Audio generation failed" },
      { status: 500 }
    );
  }
}
