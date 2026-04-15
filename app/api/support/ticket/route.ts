import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    console.error("Support ticket list error:", error);
    return NextResponse.json({ tickets: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, message } = await request.json();
    if (!category || !message) {
      return NextResponse.json({ error: "category and message required" }, { status: 400 });
    }

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      category,
      message,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support ticket create error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
