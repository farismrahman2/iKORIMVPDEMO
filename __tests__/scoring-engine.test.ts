import { scoreExam, determineReadinessBand, SECTION_WEIGHTS, DIFFICULTY_WEIGHTS } from "@/lib/scoring-engine";
import type { ExamResponse, Question, DifficultyLevel, SectionType } from "@/types";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    section: "vocab",
    subtype: "word_meaning",
    difficulty: "medium",
    topic: "greetings",
    skill_tag: "word_meaning",
    frequency_tier: "high",
    question_text: "What does X mean?",
    options: ["A", "B", "C", "D"],
    correct_answer: 0,
    explanation_en: "Explanation",
    explanation_bn: "ব্যাখ্যা",
    audio_url: null,
    audio_script: null,
    distractor_logic: null,
    source_type: "authored",
    validated: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeResponse(overrides: Partial<ExamResponse> = {}): ExamResponse {
  return {
    id: "r1",
    session_id: "s1",
    question_id: "q1",
    user_answer: 0,
    is_correct: true,
    time_taken_ms: 5000,
    skill_tag: "word_meaning",
    difficulty: "medium",
    ...overrides,
  };
}

describe("Scoring Engine", () => {
  describe("determineReadinessBand", () => {
    it("returns strong for >= 79%", () => {
      expect(determineReadinessBand(79)).toBe("strong");
      expect(determineReadinessBand(100)).toBe("strong");
      expect(determineReadinessBand(95.5)).toBe("strong");
    });

    it("returns probable for 68-78%", () => {
      expect(determineReadinessBand(68)).toBe("probable");
      expect(determineReadinessBand(78)).toBe("probable");
      expect(determineReadinessBand(73.5)).toBe("probable");
    });

    it("returns borderline for 55-67%", () => {
      expect(determineReadinessBand(55)).toBe("borderline");
      expect(determineReadinessBand(67)).toBe("borderline");
      expect(determineReadinessBand(60)).toBe("borderline");
    });

    it("returns high_risk for < 55%", () => {
      expect(determineReadinessBand(54)).toBe("high_risk");
      expect(determineReadinessBand(0)).toBe("high_risk");
      expect(determineReadinessBand(30)).toBe("high_risk");
    });

    // Edge case: boundary values
    it("handles exact boundary values correctly", () => {
      expect(determineReadinessBand(78.9)).toBe("probable");
      expect(determineReadinessBand(67.9)).toBe("borderline");
      expect(determineReadinessBand(54.9)).toBe("high_risk");
    });

    // Edge case: negative score
    it("handles negative score", () => {
      expect(determineReadinessBand(-10)).toBe("high_risk");
    });
  });

  describe("scoreExam", () => {
    it("scores a perfect exam correctly", () => {
      const questions = [
        makeQuestion({ id: "q1", section: "vocab", difficulty: "easy" }),
        makeQuestion({ id: "q2", section: "grammar_reading", difficulty: "medium" }),
        makeQuestion({ id: "q3", section: "listening", difficulty: "hard" }),
      ];

      const responses = [
        makeResponse({ question_id: "q1", is_correct: true, skill_tag: "word_meaning", difficulty: "easy" }),
        makeResponse({ question_id: "q2", is_correct: true, skill_tag: "particle", difficulty: "medium" }),
        makeResponse({ question_id: "q3", is_correct: true, skill_tag: "listening_gist", difficulty: "hard" }),
      ];

      const result = scoreExam("session1", responses, questions);

      expect(result.overall_score).toBe(100);
      expect(result.section_scores.vocab).toBe(100);
      expect(result.section_scores.grammar_reading).toBe(100);
      expect(result.section_scores.listening).toBe(100);
      expect(result.weighted_score).toBe(100);
      expect(result.readiness_band).toBe("strong");
    });

    it("scores a zero-score exam correctly", () => {
      const questions = [
        makeQuestion({ id: "q1", section: "vocab" }),
        makeQuestion({ id: "q2", section: "grammar_reading" }),
        makeQuestion({ id: "q3", section: "listening" }),
      ];

      const responses = [
        makeResponse({ question_id: "q1", is_correct: false, skill_tag: "word_meaning" }),
        makeResponse({ question_id: "q2", is_correct: false, skill_tag: "particle" }),
        makeResponse({ question_id: "q3", is_correct: false, skill_tag: "listening_gist" }),
      ];

      const result = scoreExam("session1", responses, questions);

      expect(result.overall_score).toBe(0);
      expect(result.section_scores.vocab).toBe(0);
      expect(result.weighted_score).toBe(0);
      expect(result.readiness_band).toBe("high_risk");
    });

    // Edge case: empty responses
    it("handles empty responses array", () => {
      const result = scoreExam("session1", [], []);

      expect(result.overall_score).toBe(0);
      expect(result.weighted_score).toBe(0);
      expect(result.readiness_band).toBe("high_risk");
      expect(result.skill_scores).toEqual([]);
    });

    // Edge case: response with no matching question
    it("handles responses with missing questions gracefully", () => {
      const questions = [makeQuestion({ id: "q1" })];
      const responses = [
        makeResponse({ question_id: "q_missing", is_correct: true }),
      ];

      const result = scoreExam("session1", responses, questions);
      // Should not throw
      expect(result).toBeDefined();
    });

    // Edge case: only one section has questions
    it("handles exam with only vocab questions", () => {
      const questions = [
        makeQuestion({ id: "q1", section: "vocab" }),
        makeQuestion({ id: "q2", section: "vocab" }),
      ];

      const responses = [
        makeResponse({ question_id: "q1", is_correct: true, skill_tag: "word_meaning" }),
        makeResponse({ question_id: "q2", is_correct: false, skill_tag: "word_meaning" }),
      ];

      const result = scoreExam("session1", responses, questions);

      expect(result.section_scores.vocab).toBe(50);
      expect(result.section_scores.grammar_reading).toBe(0);
      expect(result.section_scores.listening).toBe(0);
      expect(result.overall_score).toBe(50);
    });

    it("calculates per-skill scores correctly", () => {
      const questions = [
        makeQuestion({ id: "q1", section: "vocab", skill_tag: "word_meaning" }),
        makeQuestion({ id: "q2", section: "vocab", skill_tag: "word_meaning" }),
        makeQuestion({ id: "q3", section: "vocab", skill_tag: "kana_recognition" }),
      ];

      const responses = [
        makeResponse({ question_id: "q1", is_correct: true, skill_tag: "word_meaning" }),
        makeResponse({ question_id: "q2", is_correct: false, skill_tag: "word_meaning" }),
        makeResponse({ question_id: "q3", is_correct: true, skill_tag: "kana_recognition" }),
      ];

      const result = scoreExam("session1", responses, questions);

      const wordMeaning = result.skill_scores.find((s) => s.skill_tag === "word_meaning");
      const kanaRecog = result.skill_scores.find((s) => s.skill_tag === "kana_recognition");

      expect(wordMeaning?.percentage).toBe(50);
      expect(wordMeaning?.correct).toBe(1);
      expect(wordMeaning?.total).toBe(2);
      expect(kanaRecog?.percentage).toBe(100);
    });

    it("applies difficulty weights correctly", () => {
      const easyQ = makeQuestion({ id: "q1", section: "vocab", difficulty: "easy" });
      const hardQ = makeQuestion({ id: "q2", section: "vocab", difficulty: "hard" });

      // Only hard question correct — should have higher weighted score
      const responses1 = [
        makeResponse({ question_id: "q1", is_correct: false, difficulty: "easy" }),
        makeResponse({ question_id: "q2", is_correct: true, difficulty: "hard" }),
      ];

      // Only easy question correct — should have lower weighted score
      const responses2 = [
        makeResponse({ question_id: "q1", is_correct: true, difficulty: "easy" }),
        makeResponse({ question_id: "q2", is_correct: false, difficulty: "hard" }),
      ];

      const result1 = scoreExam("s1", responses1, [easyQ, hardQ]);
      const result2 = scoreExam("s2", responses2, [easyQ, hardQ]);

      // Getting the hard question right should give higher weighted score
      expect(result1.weighted_score).toBeGreaterThan(result2.weighted_score);
    });

    // Edge case: null user_answer (skipped questions)
    it("treats null user_answer as incorrect", () => {
      const questions = [makeQuestion({ id: "q1" })];
      const responses = [
        makeResponse({ question_id: "q1", user_answer: null, is_correct: false }),
      ];

      const result = scoreExam("s1", responses, questions);
      expect(result.overall_score).toBe(0);
    });
  });

  describe("constants", () => {
    it("section weights sum to 1.0", () => {
      const sum = Object.values(SECTION_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it("difficulty weights are correctly ordered", () => {
      expect(DIFFICULTY_WEIGHTS.easy).toBeLessThan(DIFFICULTY_WEIGHTS.medium);
      expect(DIFFICULTY_WEIGHTS.medium).toBeLessThan(DIFFICULTY_WEIGHTS.hard);
    });
  });
});
