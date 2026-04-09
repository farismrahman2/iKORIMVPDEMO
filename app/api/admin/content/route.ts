import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminDb = createServiceRoleClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "vocabulary";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const search = searchParams.get("search") || "";
    const section = searchParams.get("section") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const validated = searchParams.get("validated");
    const category = searchParams.get("category") || "";
    const frequency = searchParams.get("frequency") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const table = type === "vocabulary" ? "vocabulary" : "questions";
    let query = adminDb.from(table).select("*", { count: "exact" });

    // Apply filters
    if (search) {
      if (type === "vocabulary") {
        query = query.or(
          `word.ilike.%${search}%,kana.ilike.%${search}%,meaning_en.ilike.%${search}%,meaning_bn.ilike.%${search}%`
        );
      } else {
        query = query.ilike("question_text", `%${search}%`);
      }
    }

    if (section && type === "questions") {
      query = query.eq("section", section);
    }
    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }
    if (validated !== null && validated !== "") {
      query = query.eq("validated", validated === "true");
    }
    if (category && type === "vocabulary") {
      query = query.eq("category", category);
    }
    if (frequency) {
      query = query.eq("frequency_tier", frequency);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data, total: count || 0 });
  } catch (error) {
    console.error("Content list error:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}
