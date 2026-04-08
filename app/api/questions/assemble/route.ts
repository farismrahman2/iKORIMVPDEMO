import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { assembleExam } from "@/lib/exam-assembler";
import type { AssembleRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: AssembleRequest = await request.json();
    const { exam_type, section_filter, user_id } = body;

    if (!exam_type || !user_id) {
      return NextResponse.json(
        { error: "exam_type and user_id are required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const { blueprint, questions } = await assembleExam(
      cookieStore,
      exam_type,
      user_id,
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
