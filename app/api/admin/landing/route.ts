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
      .from("landing_page_config")
      .select("*")
      .order("key");

    return NextResponse.json({ config: data || [] });
  } catch (error) {
    console.error("Landing config error:", error);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const adminDb = createServiceRoleClient();
    await adminDb
      .from("landing_page_config")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Landing config update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
