/**
 * Edge case tests for the iKORI JLPT N5 Pass Engine.
 * These test boundary conditions, invalid inputs, and unusual states
 * that could occur in production.
 */

import { calculateNextReview } from "@/lib/srs";
import { scoreExam, determineReadinessBand } from "@/lib/scoring-engine";
import { getBlueprint } from "@/lib/exam-assembler";
import type { ExamResponse, Question } from "@/types";

describe("Edge Cases", () => {
  describe("SRS Edge Cases", () => {
    it("handles zero interval_days — ensures minimum of 1", () => {
      const card = { interval_days: 0, ease_factor: 2.5, review_count: 3 };
      const result = calculateNextReview(card, "good");
      // round(0 * 2.5) = 0, clamped to minimum 1
      expect(result.interval_days).toBeGreaterThanOrEqual(1);
    });

    it("handles very low ease_factor at boundary", () => {
      const card = { interval_days: 1, ease_factor: 1.31, review_count: 0 };
      const result = calculateNextReview(card, "again");
      // 1.31 - 0.2 = 1.11, should clamp to 1.3
      expect(result.ease_factor).toBe(1.3);
    });

    it("handles high review_count", () => {
      const card = { interval_days: 100, ease_factor: 2.5, review_count: 1000 };
      const result = calculateNextReview(card, "good");
      expect(result.interval_days).toBeGreaterThan(100);
      expect(Number.isFinite(result.interval_days)).toBe(true);
    });
  });

  describe("Scoring Edge Cases", () => {
    it("handles exam with single question", () => {
      const q: Question = {
        id: "q1", section: "vocab", subtype: "word_meaning", difficulty: "medium",
        topic: "test", skill_tag: "word_meaning", frequency_tier: "high",
        question_text: "test", options: ["A", "B", "C", "D"], correct_answer: 0,
        explanation_en: "", explanation_bn: "", audio_url: null, audio_script: null,
        distractor_logic: null, source_type: "authored", validated: true,
        created_at: new Date().toISOString(),
      };

      const r: ExamResponse = {
        id: "r1", session_id: "s1", question_id: "q1", user_answer: 0,
        is_correct: true, time_taken_ms: 1000, skill_tag: "word_meaning",
        difficulty: "medium",
      };

      const result = scoreExam("s1", [r], [q]);
      expect(result.overall_score).toBe(100);
      expect(result.skill_scores).toHaveLength(1);
    });

    it("handles all questions being from the same skill tag", () => {
      const questions: Question[] = Array.from({ length: 10 }, (_, i) => ({
        id: `q${i}`, section: "vocab" as const, subtype: "word_meaning",
        difficulty: "medium" as const, topic: "test", skill_tag: "word_meaning" as const,
        frequency_tier: "high" as const, question_text: `test ${i}`,
        options: ["A", "B", "C", "D"], correct_answer: 0, explanation_en: "",
        explanation_bn: "", audio_url: null, audio_script: null,
        distractor_logic: null, source_type: "authored" as const, validated: true,
        created_at: new Date().toISOString(),
      }));

      const responses: ExamResponse[] = questions.map((q, i) => ({
        id: `r${i}`, session_id: "s1", question_id: q.id,
        user_answer: i < 7 ? 0 : 1, is_correct: i < 7,
        time_taken_ms: 1000, skill_tag: "word_meaning" as const,
        difficulty: "medium" as const,
      }));

      const result = scoreExam("s1", responses, questions);
      expect(result.skill_scores).toHaveLength(1);
      expect(result.skill_scores[0].percentage).toBe(70);
    });

    it("handles very large exam (100+ questions)", () => {
      const questions: Question[] = Array.from({ length: 150 }, (_, i) => ({
        id: `q${i}`,
        section: (["vocab", "grammar_reading", "listening"] as const)[i % 3],
        subtype: "test", difficulty: "medium" as const, topic: "test",
        skill_tag: "word_meaning" as const, frequency_tier: "high" as const,
        question_text: `q${i}`, options: ["A", "B", "C", "D"], correct_answer: 0,
        explanation_en: "", explanation_bn: "", audio_url: null, audio_script: null,
        distractor_logic: null, source_type: "authored" as const, validated: true,
        created_at: new Date().toISOString(),
      }));

      const responses: ExamResponse[] = questions.map((q) => ({
        id: `r-${q.id}`, session_id: "s1", question_id: q.id,
        user_answer: 0, is_correct: true, time_taken_ms: 1000,
        skill_tag: "word_meaning" as const, difficulty: "medium" as const,
      }));

      const result = scoreExam("s1", responses, questions);
      expect(result.overall_score).toBe(100);
      expect(Number.isFinite(result.weighted_score)).toBe(true);
    });

    // Edge: readiness band boundary precision
    it("handles floating point boundary at 79%", () => {
      expect(determineReadinessBand(78.999)).toBe("probable");
      expect(determineReadinessBand(79.0)).toBe("strong");
      expect(determineReadinessBand(79.001)).toBe("strong");
    });

    it("handles floating point boundary at 68%", () => {
      expect(determineReadinessBand(67.999)).toBe("borderline");
      expect(determineReadinessBand(68.0)).toBe("probable");
    });

    it("handles floating point boundary at 55%", () => {
      expect(determineReadinessBand(54.999)).toBe("high_risk");
      expect(determineReadinessBand(55.0)).toBe("borderline");
    });
  });

  describe("Blueprint Edge Cases", () => {
    it("all exam types return valid blueprints", () => {
      const types = ["full", "speed", "diagnostic"] as const;
      for (const t of types) {
        const bp = getBlueprint(t);
        expect(bp.total_questions).toBeGreaterThan(0);
        expect(bp.time_limit_sec).toBeGreaterThan(0);
        expect(bp.sections.length).toBeGreaterThan(0);
      }
    });

    it("all section types produce valid blueprints", () => {
      const sections = ["vocab", "grammar_reading", "listening"] as const;
      for (const s of sections) {
        const bp = getBlueprint("section", s);
        expect(bp.total_questions).toBeGreaterThan(0);
        expect(bp.time_limit_sec).toBeGreaterThan(0);
        expect(bp.sections).toHaveLength(1);
        expect(bp.sections[0].section).toBe(s);
      }
    });
  });

  describe("Data Validation Edge Cases", () => {
    it("seed vocab JSON has required fields", () => {
      const vocab = require("../scripts/data/vocab_seed.json");
      expect(vocab.type).toBe("vocabulary");
      expect(vocab.items.length).toBe(30);

      for (const item of vocab.items) {
        expect(item.word).toBeTruthy();
        expect(item.kana).toBeTruthy();
        expect(item.meaning_en).toBeTruthy();
        expect(item.meaning_bn).toBeTruthy();
        expect(item.example_sentence_jp).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect([1, 2, 3]).toContain(item.difficulty);
        expect(["high", "medium"]).toContain(item.frequency_tier);
      }
    });

    it("seed questions JSON has required fields", () => {
      const questions = require("../scripts/data/questions_seed.json");
      expect(questions.type).toBe("questions");
      expect(questions.items.length).toBe(30);

      for (const item of questions.items) {
        expect(["vocab", "grammar_reading", "listening"]).toContain(item.section);
        expect(["easy", "medium", "hard"]).toContain(item.difficulty);
        expect(item.question_text).toBeTruthy();
        expect(item.options).toHaveLength(4);
        expect(item.correct_answer).toBeGreaterThanOrEqual(0);
        expect(item.correct_answer).toBeLessThanOrEqual(3);
        expect(item.explanation_en).toBeTruthy();
        expect(item.explanation_bn).toBeTruthy();
        expect(item.skill_tag).toBeTruthy();
      }
    });

    it("seed questions have correct difficulty distribution", () => {
      const questions = require("../scripts/data/questions_seed.json");
      const counts: Record<string, number> = {};
      for (const item of questions.items) {
        counts[item.difficulty] = (counts[item.difficulty] || 0) + 1;
      }

      // Should have a mix of difficulties
      expect(counts.easy).toBeGreaterThan(0);
      expect(counts.medium).toBeGreaterThan(0);
      expect(counts.hard).toBeGreaterThan(0);
    });

    it("all listening questions have audio_script", () => {
      const questions = require("../scripts/data/questions_seed.json");
      const listeningQs = questions.items.filter(
        (q: { section: string }) => q.section === "listening"
      );
      for (const q of listeningQs) {
        expect(q.audio_script).toBeTruthy();
      }
    });

    it("all correct_answer indices point to valid options", () => {
      const questions = require("../scripts/data/questions_seed.json");
      for (const item of questions.items) {
        expect(item.correct_answer).toBeLessThan(item.options.length);
      }
    });
  });
});
