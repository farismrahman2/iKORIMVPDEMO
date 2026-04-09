import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { assembleExam, getBlueprint } from "@/lib/exam-assembler";
import type { CreateSessionRequest } from "@/types";

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

    const body: CreateSessionRequest = await request.json();
    const { exam_type, section_filter } = body;

    if (!exam_type) {
      return NextResponse.json(
        { error: "exam_type is required" },
        { status: 400 }
      );
    }

    const blueprint = getBlueprint(exam_type, section_filter);

    // Ensure user profile exists (auto-create if missing)
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      await supabase.from("user_profiles").insert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Learner",
        onboarded: false,
        streak: 0,
        pass_probability: 0,
      });
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("exam_sessions")
      .insert({
        user_id: user.id,
        exam_type,
        section_filter: section_filter || null,
        time_limit_sec: blueprint.time_limit_sec,
        status: "in_progress",
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session", details: sessionError?.message },
        { status: 500 }
      );
    }

    // Assemble questions
    const { questions } = await assembleExam(
      cookieStore,
      exam_type,
      user.id,
      section_filter
    );

    return NextResponse.json({
      session,
      questions,
      blueprint,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
