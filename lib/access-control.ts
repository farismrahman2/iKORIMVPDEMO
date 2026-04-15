import type { SupabaseClient } from "@supabase/supabase-js";

export const FREEMIUM_LIMITS: Record<string, number> = {
  vocab: 3,
  grammar: 2,
  listening: 1,
  flashcards: 1,
  mock_exam: 1, // lifetime, not weekly
};

export type AccessResult = {
  allowed: boolean;
  reason: "ok" | "limit_reached" | "upgrade_required" | "not_authenticated";
  remaining?: number;
  limit?: number;
  tier?: string;
};

export async function checkAccess(
  supabase: SupabaseClient,
  userId: string,
  module: string
): Promise<AccessResult> {
  // Check user tier
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  const tier = profile?.tier || "free";

  // Paid users: unlimited
  if (tier === "paid") {
    // Also verify active subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sub && new Date(sub.expires_at) > new Date()) {
      return { allowed: true, reason: "ok", tier: "paid" };
    }
    // Subscription expired — treat as free
  }

  // Free user: check limits
  const limit = FREEMIUM_LIMITS[module];
  if (limit === undefined) {
    return { allowed: true, reason: "ok", remaining: 999, limit: 999, tier };
  }

  // Mock exam: lifetime limit (not weekly)
  if (module === "mock_exam") {
    const { data: allCounts } = await supabase
      .from("freemium_session_counts")
      .select("count")
      .eq("user_id", userId)
      .eq("module", "mock_exam");

    const totalUsed = (allCounts || []).reduce(
      (sum: number, row: { count: number }) => sum + (row.count || 0),
      0
    );

    if (totalUsed >= limit) {
      return { allowed: false, reason: "upgrade_required", remaining: 0, limit, tier };
    }
    return { allowed: true, reason: "ok", remaining: limit - totalUsed, limit, tier };
  }

  // Weekly modules
  const weekStart = getWeekStartDate();
  const { data: sessionCount } = await supabase
    .from("freemium_session_counts")
    .select("count")
    .eq("user_id", userId)
    .eq("module", module)
    .eq("week_start_date", weekStart)
    .single();

  const used = sessionCount?.count || 0;

  if (used >= limit) {
    return { allowed: false, reason: "limit_reached", remaining: 0, limit, tier };
  }

  return { allowed: true, reason: "ok", remaining: limit - used, limit, tier };
}

export async function incrementSessionCount(
  supabase: SupabaseClient,
  userId: string,
  module: string
): Promise<void> {
  const weekStart = module === "mock_exam" ? "2000-01-01" : getWeekStartDate();

  // Try to get existing row
  const { data: existing } = await supabase
    .from("freemium_session_counts")
    .select("id, count")
    .eq("user_id", userId)
    .eq("module", module)
    .eq("week_start_date", weekStart)
    .single();

  if (existing) {
    await supabase
      .from("freemium_session_counts")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("freemium_session_counts").insert({
      user_id: userId,
      module,
      week_start_date: weekStart,
      count: 1,
    });
  }
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0];
}
