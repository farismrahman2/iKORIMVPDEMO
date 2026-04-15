import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    // Try trial-flagged questions first
    const { data: trialQuestions } = await supabase
      .from("questions")
      .select("*")
      .eq("validated", true)
      .eq("trial", true);

    if (trialQuestions && trialQuestions.length >= 20) {
      return NextResponse.json({ questions: shuffle(trialQuestions).slice(0, 20) });
    }

    // Fallback: pull random validated questions
    const [vocabRes, grammarRes, listeningRes] = await Promise.all([
      supabase
        .from("questions")
        .select("*")
        .eq("validated", true)
        .eq("section", "vocab")
        .limit(30),
      supabase
        .from("questions")
        .select("*")
        .eq("validated", true)
        .eq("section", "grammar_reading")
        .limit(20),
      supabase
        .from("questions")
        .select("*")
        .eq("validated", true)
        .eq("section", "listening")
        .limit(15),
    ]);

    const vocab = shuffle(vocabRes.data || []).slice(0, 10);
    const grammar = shuffle(grammarRes.data || []).slice(0, 5);
    const listening = shuffle(listeningRes.data || []).slice(0, 5);

    const questions = [...vocab, ...grammar, ...listening];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Trial questions error:", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
