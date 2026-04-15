import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { checkAccess } from "@/lib/access-control";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ allowed: false, reason: "not_authenticated" });
    }

    const { module } = await request.json();
    if (!module) {
      return NextResponse.json({ error: "module required" }, { status: 400 });
    }

    const result = await checkAccess(supabase, user.id, module);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Access check error:", error);
    return NextResponse.json({ allowed: true, reason: "ok" });
  }
}
