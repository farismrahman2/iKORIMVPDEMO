import { SupabaseClient } from "@supabase/supabase-js";

export async function updateStreak(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("streak, last_active")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const now = new Date();
  const lastActive = profile.last_active ? new Date(profile.last_active) : null;

  let newStreak = profile.streak || 0;

  if (lastActive) {
    const diffHours =
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    if (diffHours > 48) {
      // More than 48 hours — reset streak
      newStreak = 1;
    } else if (diffHours > 20) {
      // Between 20-48 hours — new day, increment streak
      newStreak += 1;
    }
    // Less than 20 hours — same day, keep streak
  } else {
    newStreak = 1;
  }

  await supabase
    .from("user_profiles")
    .update({
      streak: newStreak,
      last_active: now.toISOString(),
    })
    .eq("id", userId);

  return newStreak;
}
