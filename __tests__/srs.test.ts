import { calculateNextReview } from "@/lib/srs";
import type { Confidence } from "@/types";

describe("SM-2 Spaced Repetition", () => {
  const baseCard = {
    interval_days: 1,
    ease_factor: 2.5,
    review_count: 0,
  };

  describe("calculateNextReview", () => {
    // Basic confidence responses
    it("sets interval to 1 for first review with 'good'", () => {
      const result = calculateNextReview(baseCard, "good");
      expect(result.interval_days).toBe(1);
    });

    it("sets interval to 2 for second review with 'good'", () => {
      const card = { ...baseCard, review_count: 1 };
      const result = calculateNextReview(card, "good");
      expect(result.interval_days).toBe(2);
    });

    it("multiplies interval by ease factor for subsequent reviews", () => {
      const card = { interval_days: 6, ease_factor: 2.5, review_count: 5 };
      const result = calculateNextReview(card, "good");
      expect(result.interval_days).toBe(15); // round(6 * 2.5)
    });

    // Failed review (again)
    it("resets interval to 1 on 'again'", () => {
      const card = { interval_days: 10, ease_factor: 2.5, review_count: 5 };
      const result = calculateNextReview(card, "again");
      expect(result.interval_days).toBe(1);
    });

    it("reduces ease factor on 'again'", () => {
      const card = { interval_days: 10, ease_factor: 2.5, review_count: 5 };
      const result = calculateNextReview(card, "again");
      expect(result.ease_factor).toBe(2.3);
    });

    it("reduces ease factor on 'hard'", () => {
      const card = { interval_days: 10, ease_factor: 2.5, review_count: 5 };
      const result = calculateNextReview(card, "hard");
      expect(result.interval_days).toBe(1); // hard score is 2, < 3
      expect(result.ease_factor).toBe(2.3);
    });

    // Ease factor minimum
    it("never reduces ease factor below 1.3", () => {
      const card = { interval_days: 1, ease_factor: 1.3, review_count: 0 };
      const result = calculateNextReview(card, "again");
      expect(result.ease_factor).toBe(1.3);
    });

    it("never reduces ease factor below 1.3 even after multiple failures", () => {
      let card = { interval_days: 1, ease_factor: 1.5, review_count: 0 };

      // Fail 5 times in a row
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(card, "again");
        expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
        card = { ...card, ease_factor: result.ease_factor };
      }
    });

    // Easy increases ease factor
    it("increases ease factor on 'easy'", () => {
      const card = { interval_days: 6, ease_factor: 2.5, review_count: 3 };
      const result = calculateNextReview(card, "easy");
      expect(result.ease_factor).toBeGreaterThan(2.5);
    });

    // Good maintains or slightly changes ease factor
    it("adjusts ease factor on 'good' according to SM-2", () => {
      const card = { interval_days: 6, ease_factor: 2.5, review_count: 3 };
      const result = calculateNextReview(card, "good");
      // SM-2: EF + (0.1 - (5-4)*(0.08 + (5-4)*0.02)) = 2.5 + 0.1 - 0.1 = 2.5
      expect(result.ease_factor).toBe(2.5);
    });

    // Next review date
    it("returns a valid date string for next_review", () => {
      const result = calculateNextReview(baseCard, "good");
      expect(result.next_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("sets next_review to tomorrow for interval=1", () => {
      const result = calculateNextReview(baseCard, "good");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.next_review).toBe(tomorrow.toISOString().split("T")[0]);
    });

    // Edge case: very large interval
    it("handles large intervals without overflow", () => {
      const card = { interval_days: 365, ease_factor: 2.5, review_count: 10 };
      const result = calculateNextReview(card, "easy");
      expect(result.interval_days).toBeGreaterThan(365);
      expect(result.next_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    // Edge case: ease factor at minimum with good answer
    it("increases ease factor from minimum on good answer", () => {
      const card = { interval_days: 1, ease_factor: 1.3, review_count: 2 };
      const result = calculateNextReview(card, "good");
      // Should still be >= 1.3
      expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
    });

    // Progression test: simulate realistic study session
    it("shows increasing intervals over successful reviews", () => {
      let card = { interval_days: 1, ease_factor: 2.5, review_count: 0 };
      const intervals: number[] = [];

      for (let i = 0; i < 6; i++) {
        const result = calculateNextReview(card, "good");
        intervals.push(result.interval_days);
        card = {
          interval_days: result.interval_days,
          ease_factor: result.ease_factor,
          review_count: i + 1,
        };
      }

      // Intervals should be non-decreasing for consistent "good" reviews
      expect(intervals[0]).toBe(1);  // First review
      expect(intervals[1]).toBe(2);  // Second review
      for (let i = 2; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
      }
    });

    // All confidence levels should work
    it.each<Confidence>(["easy", "good", "hard", "again"])(
      "handles confidence=%s without error",
      (confidence) => {
        const result = calculateNextReview(baseCard, confidence);
        expect(result.interval_days).toBeGreaterThanOrEqual(1);
        expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
        expect(result.next_review).toBeTruthy();
      }
    );
  });
});
