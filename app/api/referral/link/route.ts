import { NextResponse } from "next/server";
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

    // Get existing referral code
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (profile?.referral_code) {
      return NextResponse.json({ code: profile.referral_code });
    }

    // Generate new code
    const code = Math.random().toString(36).substring(2, 10);
    await supabase
      .from("user_profiles")
      .update({ referral_code: code })
      .eq("id", user.id);

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Referral link error:", error);
    return NextResponse.json({ error: "Failed to get referral code" }, { status: 500 });
  }
}
