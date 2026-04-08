"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import FlashCard from "@/components/flashcards/FlashCard";
import ConfidenceButtons from "@/components/flashcards/ConfidenceButtons";
import { calculateNextReview } from "@/lib/srs";
import type { FlashcardState, Vocabulary, Confidence } from "@/types";

type CardMode = "classic" | "reverse" | "context";

export default function FlashcardsPage() {
  const [queue, setQueue] = useState<(FlashcardState & { vocabulary: Vocabulary })[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [cardMode, setCardMode] = useState<CardMode>("classic");
  const [reviewed, setReviewed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [adding, setAdding] = useState(false);

  const supabase = createClientComponentClient();

  const loadCards = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    // Get cards due today
    const today = new Date().toISOString().split("T")[0];
    const { data: dueCards } = await supabase
      .from("flashcard_state")
      .select("*, vocabulary(*)")
      .eq("user_id", user.id)
      .lte("next_review", today)
      .order("next_review", { ascending: true });

    // Get total active count
    const { count } = await supabase
      .from("flashcard_state")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setActiveCount(count || 0);

    if (dueCards && dueCards.length > 0) {
      setQueue(dueCards as (FlashcardState & { vocabulary: Vocabulary })[]);
      setCurrentIdx(0);
      setAllDone(false);
    } else {
      setQueue([]);
      setAllDone(true);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  async function handleRate(confidence: Confidence) {
    const card = queue[currentIdx];
    if (!card) return;

    const result = calculateNextReview(
      {
        interval_days: card.interval_days,
        ease_factor: card.ease_factor,
        review_count: card.review_count,
      },
      confidence
    );

    // Update in database
    await supabase
      .from("flashcard_state")
      .update({
        confidence,
        interval_days: result.interval_days,
        ease_factor: result.ease_factor,
        next_review: result.next_review,
        last_reviewed: new Date().toISOString(),
        review_count: card.review_count + 1,
      })
      .eq("id", card.id);

    setReviewed((r) => r + 1);

    // Move to next card
    if (currentIdx < queue.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setAllDone(true);
    }
  }

  async function addNewWords() {
    if (!userId || adding) return;
    setAdding(true);

    // Get vocabulary items that don't have flashcard_state yet
    const { data: existingIds } = await supabase
      .from("flashcard_state")
      .select("word_id")
      .eq("user_id", userId);

    const excludeIds = (existingIds || []).map(
      (e: { word_id: string }) => e.word_id
    );

    let query = supabase
      .from("vocabulary")
      .select("id")
      .eq("validated", true)
      .limit(10);

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: newWords } = await query;

    if (newWords && newWords.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("flashcard_state").insert(
        newWords.map((w: { id: string }) => ({
          user_id: userId,
          word_id: w.id,
          interval_days: 1,
          ease_factor: 2.5,
          next_review: today,
          review_count: 0,
        }))
      );
      await loadCards();
    }

    setAdding(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading flashcards...</div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Flashcards</h1>

        <div className="bg-navy-light rounded-xl p-8 text-center mb-6">
          {reviewed > 0 ? (
            <>
              <p className="text-4xl font-bold text-band-strong mb-2">All done!</p>
              <p className="text-gray-400">
                You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""} today.
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-white mb-2">All caught up!</p>
              <p className="text-gray-400">No cards due for review today.</p>
            </>
          )}
        </div>

        {activeCount < 50 && (
          <button
            onClick={addNewWords}
            disabled={adding}
            className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add 10 New Words"}
          </button>
        )}

        <p className="text-center text-gray-500 text-sm mt-4">
          {activeCount} active flashcards
        </p>
      </div>
    );
  }

  const card = queue[currentIdx];
  if (!card || !card.vocabulary) return null;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <span className="text-sm text-gray-400">
          {queue.length - currentIdx} cards left
        </span>
      </div>

      {/* Card mode selector */}
      <div className="flex gap-2 mb-6">
        {(["classic", "reverse", "context"] as CardMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setCardMode(m)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
              cardMode === m
                ? "bg-accent-orange text-white"
                : "bg-navy-light text-gray-400"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="mb-6">
        <FlashCard word={card.vocabulary} mode={cardMode} />
      </div>

      {/* Confidence buttons */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 text-center mb-3">
          How well did you know this?
        </p>
        <ConfidenceButtons onRate={handleRate} />
      </div>

      {/* Progress */}
      <div className="h-1 bg-navy-light rounded-full overflow-hidden mt-6">
        <div
          className="h-full bg-accent-orange rounded-full transition-all"
          style={{
            width: `${((currentIdx + 1) / queue.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
