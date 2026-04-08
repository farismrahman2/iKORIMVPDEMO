import { createClientComponentClient } from "./supabase";

export function logEvent(
  userId: string,
  eventType: string,
  eventData?: Record<string, unknown>
) {
  // Fire-and-forget pattern — don't await in UI code
  try {
    const supabase = createClientComponentClient();
    supabase
      .from("user_events")
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData || null,
      })
      .then(() => {});
  } catch {
    // Silently fail
  }
}
