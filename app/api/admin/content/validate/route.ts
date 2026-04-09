import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, ids, validated } = (await request.json()) as {
      type: "vocabulary" | "questions";
      ids: string[];
      validated: boolean;
    };

    if (!type || !ids || !Array.isArray(ids) || typeof validated !== "boolean") {
      return NextResponse.json(
        { error: "type, ids (array), and validated (boolean) are required" },
        { status: 400 }
      );
    }

    const adminDb = createServiceRoleClient();
    const table = type === "vocabulary" ? "vocabulary" : "questions";

    const { error } = await adminDb
      .from(table)
      .update({ validated })
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error("Validate toggle error:", error);
    return NextResponse.json({ error: "Validation toggle failed" }, { status: 500 });
  }
}
