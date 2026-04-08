// === Enums ===

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

export const ALL_SKILL_TAGS: SkillTag[] = [
  "kana_recognition",
  "kanji_reading",
  "word_meaning",
  "vocab_usage",
  "particle",
  "verb_form",
  "adjective_form",
  "sentence_completion",
  "sentence_order",
  "short_reading",
  "notice_reading",
  "listening_gist",
  "listening_detail",
  "listening_response",
  "listening_sequence",
];

// === Database Types ===

export interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  onboarded: boolean;
  streak: number;
  last_active: string | null;
  pass_probability: number;
  readiness_band: ReadinessBand | null;
  created_at: string;
}

export interface UserSkillScore {
  id: string;
  user_id: string;
  skill_tag: SkillTag;
  score: number;
  attempts: number;
  updated_at: string;
}

export interface UserWeakArea {
  user_id: string;
  skill_tag: SkillTag;
  score: number;
  flagged_at: string;
}

export interface Question {
  id: string;
  section: SectionType;
  subtype: string;
  difficulty: DifficultyLevel;
  topic: string;
  skill_tag: SkillTag;
  frequency_tier: FrequencyTier;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation_en: string;
  explanation_bn: string;
  audio_url: string | null;
  audio_script: string | null;
  distractor_logic: string | null;
  source_type: SourceType;
  validated: boolean;
  created_at: string;
}

export interface Vocabulary {
  id: string;
  word: string;
  kana: string;
  kanji: string | null;
  meaning_en: string;
  meaning_bn: string;
  example_sentence_jp: string;
  example_sentence_bn: string | null;
  audio_url: string | null;
  category: string;
  difficulty: number;
  frequency_tier: FrequencyTier;
  confusion_set: string[] | null;
  validated: boolean;
  created_at: string;
}

export interface FlashcardState {
  id: string;
  user_id: string;
  word_id: string;
  confidence: Confidence | null;
  interval_days: number;
  ease_factor: number;
  next_review: string;
  last_reviewed: string | null;
  review_count: number;
}

export interface ExamSession {
  id: string;
  user_id: string;
  exam_type: ExamType;
  section_filter: SectionType | null;
  started_at: string;
  submitted_at: string | null;
  time_limit_sec: number;
  status: "in_progress" | "submitted" | "timed_out";
  vocab_score: number | null;
  grammar_score: number | null;
  listening_score: number | null;
  overall_score: number | null;
  weighted_score: number | null;
  readiness_band: ReadinessBand | null;
}

export interface ExamResponse {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: number | null;
  is_correct: boolean | null;
  time_taken_ms: number | null;
  skill_tag: SkillTag;
  difficulty: DifficultyLevel;
}

export interface UserEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ListeningError {
  id: string;
  question_id: string | null;
  audio_url: string | null;
  error_type: string | null;
  user_agent: string | null;
  created_at: string;
}

// === Exam Blueprint ===

export interface ExamBlueprint {
  exam_type: ExamType;
  section_filter?: SectionType;
  total_questions: number;
  time_limit_sec: number;
  sections: {
    section: SectionType;
    count: number;
  }[];
  difficulty_split: Record<DifficultyLevel, number>;
  frequency_split: Record<FrequencyTier, number>;
}

// === Scoring Types ===

export interface SectionScores {
  vocab: number;
  grammar_reading: number;
  listening: number;
}

export interface SkillScore {
  skill_tag: SkillTag;
  correct: number;
  total: number;
  percentage: number;
}

export interface ExamResult {
  session_id: string;
  section_scores: SectionScores;
  weighted_score: number;
  overall_score: number;
  readiness_band: ReadinessBand;
  skill_scores: SkillScore[];
}

// === API Request/Response Types ===

export interface AssembleRequest {
  exam_type: ExamType;
  section_filter?: SectionType;
  user_id: string;
}

export interface CreateSessionRequest {
  exam_type: ExamType;
  section_filter?: SectionType;
}

export interface ScoreRequest {
  session_id: string;
  responses: {
    question_id: string;
    user_answer: number | null;
    time_taken_ms: number;
  }[];
}

export interface DailyRecommendation {
  missions: Mission[];
  weak_skills: SkillTag[];
  estimated_total_minutes: number;
}

export interface Mission {
  id: string;
  type: "flashcards" | "vocab_drill" | "listening_quiz" | "grammar_drill" | "mock_exam";
  title: string;
  description: string;
  skill_tags: SkillTag[];
  question_count: number;
  estimated_minutes: number;
  completed: boolean;
}
