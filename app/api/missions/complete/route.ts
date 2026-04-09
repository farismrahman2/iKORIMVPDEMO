import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";

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

    const { mission_type } = (await request.json()) as { mission_type: string };

    if (!mission_type) {
      return NextResponse.json(
        { error: "mission_type is required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Update the mission as completed
    const { error } = await supabase
      .from("daily_mission_progress")
      .update({
        completed: true,
        completed_count: 1,
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("mission_date", today)
      .eq("mission_type", mission_type);

    if (error) {
      // Mission row might not exist yet — create it as completed
      await supabase.from("daily_mission_progress").upsert(
        {
          user_id: user.id,
          mission_date: today,
          mission_type,
          mission_label: mission_type,
          target_count: 1,
          completed_count: 1,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,mission_date,mission_type" }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mission complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete mission" },
      { status: 500 }
    );
  }
}
