import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { assembleExam } from "@/lib/exam-assembler";
import type { AssembleRequest } from "@/types";

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

    const body: AssembleRequest = await request.json();
    const { exam_type, section_filter } = body;

    if (!exam_type) {
      return NextResponse.json(
        { error: "exam_type is required" },
        { status: 400 }
      );
    }

    // Always use the authenticated user's ID, not the body's user_id
    const { blueprint, questions } = await assembleExam(
      cookieStore,
      exam_type,
      user.id,
      section_filter
    );

    return NextResponse.json({ blueprint, questions });
  } catch (error) {
    console.error("Error assembling questions:", error);
    return NextResponse.json(
      { error: "Failed to assemble questions" },
      { status: 500 }
    );
  }
}
