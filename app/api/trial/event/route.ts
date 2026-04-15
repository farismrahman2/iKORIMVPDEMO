import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, readiness_band, utm_source, utm_medium, utm_campaign } = body;

    if (!event_type) {
      return NextResponse.json({ error: "event_type required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    await supabase.from("trial_events").insert({
      event_type,
      readiness_band: readiness_band || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trial event error:", error);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
