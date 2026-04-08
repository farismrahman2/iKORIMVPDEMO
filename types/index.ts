export type SectionType = "vocab" | "grammar_reading" | "listening";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type FrequencyTier = "high" | "medium" | "stretch";
export type SourceType = "authored" | "ai_generated" | "editor_approved";
export type ExamType = "full" | "section" | "speed" | "diagnostic";
export type ReadinessBand = "high_risk" | "borderline" | "probable" | "strong";
export type Confidence = "easy" | "good" | "hard" | "again";

export type SkillTag =
  | "kana_recognition"
  | "kanji_reading"
  | "word_meaning"
  | "vocab_usage"
  | "particle"
  | "verb_form"
  | "adjective_form"
  | "sentence_completion"
  | "sentence_order"
  | "short_reading"
  | "notice_reading"
  | "listening_gist"
  | "listening_detail"
  | "listening_response"
  | "listening_sequence";
