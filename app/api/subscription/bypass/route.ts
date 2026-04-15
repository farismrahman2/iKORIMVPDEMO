import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();
    const validPlan = plan === "exam_prep" ? "exam_prep" : "monthly";
    const daysToAdd = validPlan === "exam_prep" ? 90 : 30;
    const amount = validPlan === "exam_prep" ? 999 : 499;

    // Cancel any existing active subscription first
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "active");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // Create subscription
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: validPlan,
      status: "active",
      expires_at: expiresAt.toISOString(),
      payment_method: "bypass",
      amount_bdt: amount,
      is_refundable: true,
    });

    // Update user tier
    await supabase
      .from("user_profiles")
      .update({ tier: "paid" })
      .eq("id", user.id);

    return NextResponse.json({ success: true, tier: "paid", expires_at: expiresAt.toISOString() });
  } catch (error) {
    console.error("Subscription bypass error:", error);
    return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
  }
}
