import type { Confidence, FlashcardState } from "@/types";

const CONFIDENCE_SCORES: Record<Confidence, number> = {
  easy: 5,
  good: 4,
  hard: 2,
  again: 0,
};

export interface ReviewResult {
  interval_days: number;
  ease_factor: number;
  next_review: string;
}

export function calculateNextReview(
  card: Pick<FlashcardState, "interval_days" | "ease_factor" | "review_count">,
  confidence: Confidence
): ReviewResult {
  const score = CONFIDENCE_SCORES[confidence];
  let { interval_days, ease_factor } = card;
  const { review_count } = card;

  if (score < 3) {
    // Failed — reset interval, reduce ease factor
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else {
    // Passed — apply SM-2 formula
    if (review_count === 0) {
      interval_days = 1;
    } else if (review_count === 1) {
      interval_days = 2;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }

    // Update ease factor with SM-2 formula
    ease_factor = Math.max(
      1.3,
      ease_factor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
    );
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);

  return {
    interval_days,
    ease_factor: Math.round(ease_factor * 100) / 100,
    next_review: nextReview.toISOString().split("T")[0],
  };
}
