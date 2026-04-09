import { getBlueprint, BLUEPRINTS } from "@/lib/exam-assembler";

describe("Exam Assembler", () => {
  describe("BLUEPRINTS", () => {
    it("full blueprint has correct total (75 questions)", () => {
      const bp = BLUEPRINTS.full;
      const total = bp.sections.reduce((sum, s) => sum + s.count, 0);
      expect(total).toBe(75);
      expect(bp.total_questions).toBe(75);
    });

    it("full blueprint has correct section counts (25/30/20)", () => {
      const bp = BLUEPRINTS.full;
      expect(bp.sections.find((s) => s.section === "vocab")?.count).toBe(25);
      expect(bp.sections.find((s) => s.section === "grammar_reading")?.count).toBe(30);
      expect(bp.sections.find((s) => s.section === "listening")?.count).toBe(20);
    });

    it("full blueprint time limit is 75 minutes (4500 seconds)", () => {
      expect(BLUEPRINTS.full.time_limit_sec).toBe(4500);
    });

    it("speed blueprint has correct counts", () => {
      const bp = BLUEPRINTS.speed;
      expect(bp.total_questions).toBe(25);
      expect(bp.time_limit_sec).toBe(900); // 15 minutes
    });

    it("speed blueprint uses high-frequency only", () => {
      const bp = BLUEPRINTS.speed;
      expect(bp.frequency_split.high).toBe(1.0);
      expect(bp.frequency_split.medium).toBe(0);
      expect(bp.frequency_split.stretch).toBe(0);
    });

    it("diagnostic blueprint has 20 questions", () => {
      const bp = BLUEPRINTS.diagnostic;
      expect(bp.total_questions).toBe(20);
      const total = bp.sections.reduce((sum, s) => sum + s.count, 0);
      expect(total).toBe(20);
    });

    it("diagnostic blueprint has correct section split (8/8/4)", () => {
      const bp = BLUEPRINTS.diagnostic;
      expect(bp.sections.find((s) => s.section === "vocab")?.count).toBe(8);
      expect(bp.sections.find((s) => s.section === "grammar_reading")?.count).toBe(8);
      expect(bp.sections.find((s) => s.section === "listening")?.count).toBe(4);
    });

    // Edge case: difficulty splits should sum to ~1.0
    it("difficulty splits sum to 1.0 for all blueprints", () => {
      for (const [name, bp] of Object.entries(BLUEPRINTS)) {
        const sum = bp.difficulty_split.easy + bp.difficulty_split.medium + bp.difficulty_split.hard;
        expect(sum).toBeCloseTo(1.0, 1);
      }
    });

    // Edge case: frequency splits should sum to 1.0
    it("frequency splits sum to 1.0 for full and diagnostic", () => {
      for (const key of ["full", "diagnostic"] as const) {
        const bp = BLUEPRINTS[key];
        const sum = bp.frequency_split.high + bp.frequency_split.medium + bp.frequency_split.stretch;
        expect(sum).toBeCloseTo(1.0, 1);
      }
    });
  });

  describe("getBlueprint", () => {
    it("returns full blueprint for exam_type=full", () => {
      const bp = getBlueprint("full");
      expect(bp.exam_type).toBe("full");
      expect(bp.total_questions).toBe(75);
    });

    it("returns speed blueprint for exam_type=speed", () => {
      const bp = getBlueprint("speed");
      expect(bp.exam_type).toBe("speed");
      expect(bp.total_questions).toBe(25);
    });

    it("returns diagnostic blueprint for exam_type=diagnostic", () => {
      const bp = getBlueprint("diagnostic");
      expect(bp.exam_type).toBe("diagnostic");
      expect(bp.total_questions).toBe(20);
    });

    it("returns vocab-only section blueprint", () => {
      const bp = getBlueprint("section", "vocab");
      expect(bp.exam_type).toBe("section");
      expect(bp.section_filter).toBe("vocab");
      expect(bp.total_questions).toBe(25);
      expect(bp.sections).toHaveLength(1);
      expect(bp.sections[0].section).toBe("vocab");
    });

    it("returns grammar-only section blueprint", () => {
      const bp = getBlueprint("section", "grammar_reading");
      expect(bp.total_questions).toBe(30);
      expect(bp.sections[0].section).toBe("grammar_reading");
    });

    it("returns listening-only section blueprint", () => {
      const bp = getBlueprint("section", "listening");
      expect(bp.total_questions).toBe(20);
      expect(bp.sections[0].section).toBe("listening");
    });

    // Edge case: section type without filter
    it("returns empty section blueprint when no filter provided", () => {
      const bp = getBlueprint("section");
      // Should return the base section blueprint which has 0 questions
      expect(bp.exam_type).toBe("section");
      expect(bp.total_questions).toBe(0);
    });
  });
});
