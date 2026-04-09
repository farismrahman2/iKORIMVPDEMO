import type { SectionType, DifficultyLevel, FrequencyTier, SourceType } from "@/types";

const VALID_SECTIONS: SectionType[] = ["vocab", "grammar_reading", "listening"];
const VALID_DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];
const VALID_FREQUENCY_TIERS: FrequencyTier[] = ["high", "medium", "stretch"];
const VALID_SOURCE_TYPES: SourceType[] = ["authored", "ai_generated", "editor_approved"];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateVocabItem(item: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const requiredStrings = [
    "word",
    "kana",
    "meaning_en",
    "meaning_bn",
    "example_sentence_jp",
    "category",
  ];
  for (const field of requiredStrings) {
    if (!item[field] || typeof item[field] !== "string") {
      errors.push(`Missing or invalid required field: ${field}`);
    }
  }

  const difficulty = item.difficulty;
  if (difficulty === undefined || difficulty === null) {
    errors.push("Missing required field: difficulty");
  } else if (typeof difficulty !== "number" || difficulty < 1 || difficulty > 3) {
    errors.push("difficulty must be 1, 2, or 3");
  }

  const tier = item.frequency_tier;
  if (!tier || !VALID_FREQUENCY_TIERS.includes(tier as FrequencyTier)) {
    errors.push(`frequency_tier must be one of: ${VALID_FREQUENCY_TIERS.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateQuestionItem(item: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  const requiredStrings = [
    "question_text",
    "explanation_en",
    "explanation_bn",
    "skill_tag",
    "topic",
    "subtype",
  ];
  for (const field of requiredStrings) {
    if (!item[field] || typeof item[field] !== "string") {
      errors.push(`Missing or invalid required field: ${field}`);
    }
  }

  if (!item.section || !VALID_SECTIONS.includes(item.section as SectionType)) {
    errors.push(`section must be one of: ${VALID_SECTIONS.join(", ")}`);
  }

  if (!item.difficulty || !VALID_DIFFICULTIES.includes(item.difficulty as DifficultyLevel)) {
    errors.push(`difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`);
  }

  if (!item.frequency_tier || !VALID_FREQUENCY_TIERS.includes(item.frequency_tier as FrequencyTier)) {
    errors.push(`frequency_tier must be one of: ${VALID_FREQUENCY_TIERS.join(", ")}`);
  }

  if (item.source_type && !VALID_SOURCE_TYPES.includes(item.source_type as SourceType)) {
    errors.push(`source_type must be one of: ${VALID_SOURCE_TYPES.join(", ")}`);
  }

  const options = item.options;
  if (!Array.isArray(options) || options.length !== 4) {
    errors.push("options must be an array of exactly 4 items");
  }

  const correctAnswer = item.correct_answer;
  if (correctAnswer === undefined || correctAnswer === null) {
    errors.push("Missing required field: correct_answer");
  } else if (typeof correctAnswer !== "number" || correctAnswer < 0 || correctAnswer > 3) {
    errors.push("correct_answer must be 0, 1, 2, or 3");
  }

  return { valid: errors.length === 0, errors };
}

export function detectContentType(
  data: unknown
): "vocabulary" | "questions" | "batch" | "unknown" {
  if (!data || typeof data !== "object") return "unknown";

  const obj = data as Record<string, unknown>;

  // Standard batch format
  if (obj.type && obj.items && Array.isArray(obj.items)) {
    if (obj.type === "vocabulary") return "batch";
    if (obj.type === "questions") return "batch";
    return "batch";
  }

  // Raw array — detect from first item
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;
    if (first.word && first.kana) return "vocabulary";
    if (first.question_text && first.section) return "questions";
  }

  return "unknown";
}

export function parseBatchFormat(data: unknown): {
  type: "vocabulary" | "questions";
  batch_id: string;
  validated: boolean;
  items: Record<string, unknown>[];
} | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  // Standard batch format: { type, batch_id, validated, items }
  if (obj.type && obj.items && Array.isArray(obj.items)) {
    const type = obj.type as string;
    if (type !== "vocabulary" && type !== "questions") return null;
    return {
      type: type as "vocabulary" | "questions",
      batch_id: (obj.batch_id as string) || `import_${Date.now()}`,
      validated: obj.validated === true,
      items: obj.items as Record<string, unknown>[],
    };
  }

  // Raw array — wrap in batch format
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;
    if (first.word && first.kana) {
      return {
        type: "vocabulary",
        batch_id: `import_${Date.now()}`,
        validated: false,
        items: data as Record<string, unknown>[],
      };
    }
    if (first.question_text && first.section) {
      return {
        type: "questions",
        batch_id: `import_${Date.now()}`,
        validated: false,
        items: data as Record<string, unknown>[],
      };
    }
  }

  return null;
}
