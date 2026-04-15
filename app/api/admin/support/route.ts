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
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ tickets: data || [] });
  } catch (error) {
    console.error("Admin support error:", error);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status, admin_reply } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const adminDb = createServiceRoleClient();
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (admin_reply !== undefined) updates.admin_reply = admin_reply;
    if (status === "resolved") updates.resolved_at = new Date().toISOString();

    await adminDb.from("support_tickets").update(updates).eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin support update error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
