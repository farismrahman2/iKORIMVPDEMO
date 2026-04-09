"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import FlashCard from "@/components/flashcards/FlashCard";
import ConfidenceButtons from "@/components/flashcards/ConfidenceButtons";
import { calculateNextReview } from "@/lib/srs";
import type { FlashcardState, Vocabulary, Confidence } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

type CardMode = "classic" | "reverse" | "context";

export default function FlashcardsPage() {
  const { t } = useLanguage();

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
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted font-sans">Loading flashcards...</div>
      </div>
    );
  }

  if (allDone) {
    return (
      <FlashcardsAllDone
        reviewed={reviewed}
        activeCount={activeCount}
        adding={adding}
        onAddNewWords={addNewWords}
        t={t}
      />
    );
  }

  const MODE_LABELS: Record<CardMode, string> = {
    classic: t('classic'),
    reverse: t('reverse'),
    context: t('context'),
  };

  const card = queue[currentIdx];
  if (!card || !card.vocabulary) return null;

  return (
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-display text-ikori-dark">{t('flashcards_label')}</h1>
        <span className="text-sm text-ikori-muted font-sans">
          {t('cards_due', { count: queue.length - currentIdx })}
        </span>
      </div>

      {/* Card mode selector */}
      <div className="flex gap-2 mb-6">
        {(["classic", "reverse", "context"] as CardMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setCardMode(m)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors font-sans ${
              cardMode === m
                ? "bg-ikori-500 text-white"
                : "bg-ikori-50 text-ikori-body"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="mb-6">
        <FlashCard word={card.vocabulary} mode={cardMode} />
      </div>

      {/* Confidence buttons */}
      <div className="mb-4">
        <ConfidenceButtons onRate={handleRate} />
      </div>

      {/* Progress */}
      <div className="h-1 bg-ikori-50 rounded-full overflow-hidden mt-6">
        <div
          className="h-full bg-ikori-500 rounded-full transition-all"
          style={{
            width: `${((currentIdx + 1) / queue.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function FlashcardsAllDone({
  reviewed,
  activeCount,
  adding,
  onAddNewWords,
  t,
}: {
  reviewed: number;
  activeCount: number;
  adding: boolean;
  onAddNewWords: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const missionFired = useRef(false);

  useEffect(() => {
    if (missionFired.current) return;
    missionFired.current = true;
    fetch('/api/missions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_type: 'flashcard_session' }),
    });
  }, []);

  return (
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-bold font-display text-ikori-dark mb-6">{t('flashcards_label')}</h1>

      <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-8 text-center mb-6">
        <div className="bg-ikori-gradient-subtle rounded-ikori p-6">
          {reviewed > 0 ? (
            <>
              <p className="text-4xl font-bold text-ikori-500 mb-2 font-display">{t('session_complete')}</p>
              <p className="text-ikori-muted font-sans">
                {t('cards_reviewed', { count: reviewed } as Record<string, string | number>).replace(/\d+/, String(reviewed))}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-ikori-dark mb-2 font-display">{t('all_caught_up')}</p>
              <p className="text-ikori-muted font-sans">{t('come_back')}</p>
            </>
          )}
        </div>
      </div>

      {activeCount < 50 && (
        <button
          onClick={onAddNewWords}
          disabled={adding}
          className="btn-green w-full py-3 rounded-ikori-sm font-semibold font-sans disabled:opacity-50"
        >
          {adding ? t('loading') : t('add_new')}
        </button>
      )}

      {reviewed > 0 && (
        <p className="text-center text-ikori-muted text-sm mt-4 font-sans">
          {activeCount} {t('flashcards_label')}
        </p>
      )}
    </div>
  );
}
