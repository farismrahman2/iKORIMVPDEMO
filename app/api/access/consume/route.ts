import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { incrementSessionCount } from "@/lib/access-control";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { module } = await request.json();
    if (!module) {
      return NextResponse.json({ error: "module required" }, { status: 400 });
    }

    await incrementSessionCount(supabase, user.id, module);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Access consume error:", error);
    return NextResponse.json({ success: true });
  }
}
