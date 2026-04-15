import type { SupabaseClient } from "@supabase/supabase-js";

export async function queueNotification(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  message: string,
  channel: string = "log"
): Promise<void> {
  try {
    await supabase.from("notification_queue").insert({
      user_id: userId,
      type,
      channel,
      message,
      scheduled_at: new Date().toISOString(),
    });
  } catch {
    // Fire and forget — don't block on notification failures
  }
}
