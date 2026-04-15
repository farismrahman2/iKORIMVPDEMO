import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminDb = createServiceRoleClient();
    const { data } = await adminDb
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ subscriptions: data || [] });
  } catch (error) {
    console.error("Admin refunds error:", error);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { subscription_id } = await request.json();
    if (!subscription_id) {
      return NextResponse.json({ error: "subscription_id required" }, { status: 400 });
    }

    const adminDb = createServiceRoleClient();

    // Get subscription to find user_id
    const { data: sub } = await adminDb
      .from("subscriptions")
      .select("user_id")
      .eq("id", subscription_id)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Refund subscription
    await adminDb
      .from("subscriptions")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
      })
      .eq("id", subscription_id);

    // Downgrade user
    await adminDb
      .from("user_profiles")
      .update({ tier: "free" })
      .eq("id", sub.user_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin refund error:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
