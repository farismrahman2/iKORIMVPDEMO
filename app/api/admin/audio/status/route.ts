import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const questionIds = searchParams.get("question_ids");

    if (!questionIds) {
      return NextResponse.json(
        { error: "question_ids query parameter is required" },
        { status: 400 }
      );
    }

    const ids = questionIds.split(",").filter(Boolean);
    const adminDb = createServiceRoleClient();

    const { data, error } = await adminDb
      .from("audio_generation_log")
      .select("*")
      .in("question_id", ids)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data });
  } catch (error) {
    console.error("Audio status error:", error);
    return NextResponse.json(
      { error: "Failed to load audio status" },
      { status: 500 }
    );
  }
}
