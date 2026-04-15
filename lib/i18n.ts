export type Language = "en" | "bn";

export const translations = {
  // Navigation
  nav_home: { en: "Home", bn: "হোম" },
  nav_exam: { en: "Exam", bn: "পরীক্ষা" },
  nav_vocab: { en: "Vocab", bn: "শব্দভাণ্ডার" },
  nav_cards: { en: "Cards", bn: "কার্ড" },
  nav_listen: { en: "Listen", bn: "শোনা" },
  nav_settings: { en: "Settings", bn: "সেটিংস" },

  // Dashboard
  good_morning: { en: "Good morning", bn: "শুভ সকাল" },
  good_afternoon: { en: "Good afternoon", bn: "শুভ বিকাল" },
  good_evening: { en: "Good evening", bn: "শুভ সন্ধ্যা" },
  your_readiness: { en: "Your readiness", bn: "আপনার প্রস্তুতি" },
  todays_missions: { en: "Today's missions", bn: "আজকের মিশন" },
  weakest_skills: { en: "Weakest skills", bn: "দুর্বল দক্ষতা" },
  of_complete: { en: "{done} of {total} complete", bn: "{total} এর মধ্যে {done} সম্পন্ন" },
  take_mock: { en: "Take Mock", bn: "মক দিন" },
  flashcards_label: { en: "Flashcards", bn: "ফ্ল্যাশকার্ড" },

  // Readiness Bands
  high_risk: { en: "High Risk", bn: "উচ্চ ঝুঁকি" },
  borderline: { en: "Borderline", bn: "সীমারেখা" },
  probable_pass: { en: "Probable Pass", bn: "সম্ভাব্য পাস" },
  strong_pass: { en: "Strong Pass", bn: "শক্তিশালী পাস" },
  readiness_score: { en: "Readiness Score", bn: "প্রস্তুতির স্কোর" },

  // Exam
  full_mock: { en: "Full Mock", bn: "সম্পূর্ণ মক" },
  complete_jlpt: { en: "Complete JLPT N5 simulation", bn: "সম্পূর্ণ JLPT N5 সিমুলেশন" },
  vocab_only: { en: "Vocab Only", bn: "শুধু শব্দভাণ্ডার" },
  vocab_section: { en: "Vocabulary section practice", bn: "শব্দভাণ্ডার বিভাগ অনুশীলন" },
  grammar_only: { en: "Grammar Only", bn: "শুধু ব্যাকরণ" },
  grammar_section: { en: "Grammar & reading section", bn: "ব্যাকরণ ও পঠন বিভাগ" },
  listening_only: { en: "Listening Only", bn: "শুধু শ্রবণ" },
  listening_section: { en: "Listening section practice", bn: "শ্রবণ বিভাগ অনুশীলন" },
  speed_drill: { en: "Speed Drill", bn: "দ্রুত অনুশীলন" },
  speed_desc: { en: "25 high-frequency items, fast pace", bn: "২৫টি উচ্চ-ফ্রিকোয়েন্সি আইটেম" },
  start_exam: { en: "Start Exam", bn: "পরীক্ষা শুরু" },
  choose_exam: { en: "Choose an exam type to begin practicing", bn: "অনুশীলন শুরু করতে পরীক্ষার ধরন বাছুন" },
  submit: { en: "Submit", bn: "জমা দিন" },
  next: { en: "Next", bn: "পরবর্তী" },
  previous: { en: "Previous", bn: "আগের" },
  skip: { en: "Skip", bn: "এড়িয়ে যান" },
  question_of: { en: "Question {n} of {total}", bn: "প্রশ্ন {n} / {total}" },
  time_remaining: { en: "Time remaining", bn: "বাকি সময়" },
  confirm_submit: { en: "Are you sure you want to submit?", bn: "আপনি কি জমা দিতে চান?" },
  unanswered_warning: { en: "{count} questions unanswered", bn: "{count}টি প্রশ্নের উত্তর দেননি" },
  yes_submit: { en: "Yes, Submit", bn: "হ্যাঁ, জমা দিন" },
  cancel: { en: "Cancel", bn: "বাতিল" },
  preparing_exam: { en: "Preparing your exam...", bn: "পরীক্ষা প্রস্তুত হচ্ছে..." },
  questions: { en: "questions", bn: "প্রশ্ন" },
  min: { en: "min", bn: "মিনিট" },
  flag_review: { en: "Flag for review", bn: "পর্যালোচনার জন্য চিহ্নিত" },
  flagged: { en: "Flagged", bn: "চিহ্নিত" },
  answered_of: { en: "{done} of {total} answered", bn: "{total} এর মধ্যে {done} উত্তর দিয়েছেন" },
  n_flagged: { en: "{count} flagged", bn: "{count}টি চিহ্নিত" },
  skip_question: { en: "Skip this question", bn: "এই প্রশ্ন এড়িয়ে যান" },

  // Results
  exam_results: { en: "Exam Results", bn: "পরীক্ষার ফলাফল" },
  section_scores: { en: "Section Scores", bn: "বিভাগের নম্বর" },
  vocabulary: { en: "Vocabulary", bn: "শব্দভাণ্ডার" },
  grammar_reading: { en: "Grammar & Reading", bn: "ব্যাকরণ ও পঠন" },
  listening: { en: "Listening", bn: "শ্রবণ" },
  skill_breakdown: { en: "Skills Breakdown", bn: "দক্ষতার বিশ্লেষণ" },
  review_wrong: { en: "Review Wrong Answers ({count})", bn: "ভুল উত্তর পর্যালোচনা ({count})" },
  take_another: { en: "Take Another Mock", bn: "আরেকটি মক দিন" },
  back_dashboard: { en: "Back to Dashboard", bn: "ড্যাশবোর্ডে ফিরুন" },
  back_results: { en: "Back to Results", bn: "ফলাফলে ফিরুন" },
  wrong_answer: { en: "Wrong Answer {n} of {total}", bn: "ভুল উত্তর {n} / {total}" },

  // Vocab Module
  recognition: { en: "Recognition", bn: "চিনুন" },
  recall: { en: "Recall", bn: "মনে করুন" },
  reading: { en: "Reading", bn: "পঠন" },
  usage: { en: "Usage", bn: "ব্যবহার" },
  jp_to_en: { en: "JP → EN", bn: "JP → BN" },
  en_to_jp: { en: "EN → JP", bn: "BN → JP" },
  kanji_to_kana: { en: "Kanji → Kana", bn: "কাঞ্জি → কানা" },
  context: { en: "Context", bn: "প্রসঙ্গ" },
  all_categories: { en: "All Categories", bn: "সব বিভাগ" },
  all_levels: { en: "All Levels", bn: "সব স্তর" },
  easy_level: { en: "Easy", bn: "সহজ" },
  medium_level: { en: "Medium", bn: "মাঝারি" },
  hard_level: { en: "Hard", bn: "কঠিন" },
  fill_blank: { en: "Fill in the blank", bn: "শূন্যস্থান পূরণ করুন" },
  no_vocab: { en: "No vocabulary items found for this filter.", bn: "এই ফিল্টারে কোন শব্দ পাওয়া যায়নি।" },

  // Flashcards
  cards_due: { en: "{count} cards due today", bn: "আজ {count}টি কার্ড বাকি" },
  all_caught_up: { en: "All caught up!", bn: "সব শেষ!" },
  come_back: { en: "Come back tomorrow for more cards", bn: "আগামীকাল আরও কার্ডের জন্য আসুন" },
  add_new: { en: "Add 10 New Words", bn: "১০টি নতুন শব্দ যোগ করুন" },
  practice_again: { en: "Practice Again", bn: "আবার অনুশীলন করুন" },
  easy: { en: "Easy", bn: "সহজ" },
  good: { en: "Good", bn: "ভালো" },
  hard: { en: "Hard", bn: "কঠিন" },
  again: { en: "Again", bn: "আবার" },
  classic: { en: "Classic", bn: "ক্লাসিক" },
  reverse: { en: "Reverse", bn: "উল্টো" },
  tap_to_flip: { en: "Tap to flip", bn: "উল্টাতে ট্যাপ করুন" },

  // Listening
  standard_mcq: { en: "Standard MCQ", bn: "সাধারণ MCQ" },
  sequence: { en: "Sequence", bn: "ক্রমানুসারে" },
  fill_blank_mode: { en: "Fill Blank", bn: "শূন্যস্থান পূরণ" },
  choose_reply: { en: "Choose Reply", bn: "উত্তর বাছুন" },
  transcript_mode: { en: "Transcript", bn: "স্ক্রিপ্ট" },
  clip_of: { en: "Clip {n} / {total}", bn: "ক্লিপ {n} / {total}" },
  correct_of: { en: "{correct} / {total} correct", bn: "{correct} / {total} সঠিক" },
  audio_not_available: { en: "Audio not available", bn: "অডিও পাওয়া যায়নি" },
  no_listening: { en: "No listening questions available for this mode yet.", bn: "এই মোডের জন্য এখনও কোন শ্রবণ প্রশ্ন নেই।" },
  finish: { en: "Finish", bn: "শেষ করুন" },
  next_clip: { en: "Next Clip", bn: "পরবর্তী ক্লিপ" },
  show_transcript: { en: "Show Transcript", bn: "স্ক্রিপ্ট দেখুন" },
  translation: { en: "Translation", bn: "অনুবাদ" },
  romaji: { en: "Romaji", bn: "রোমাজি" },

  // Missions
  flashcard_session: { en: "Review Flashcards", bn: "ফ্ল্যাশকার্ড পর্যালোচনা" },
  vocab_drill: { en: "Vocabulary Drill", bn: "শব্দ অনুশীলন" },
  listening_quiz: { en: "Listening Practice", bn: "শ্রবণ অনুশীলন" },
  grammar_drill: { en: "Grammar Drill", bn: "ব্যাকরণ অনুশীলন" },
  mock_exam: { en: "Mock Exam", bn: "মক পরীক্ষা" },
  weak_skill_drill: { en: "Weak Skill Drill", bn: "দুর্বল দক্ষতা অনুশীলন" },
  items: { en: "items", bn: "আইটেম" },

  // Session Complete
  session_complete: { en: "Session Complete", bn: "সেশন সম্পন্ন" },
  correct: { en: "correct", bn: "সঠিক" },

  // Onboarding
  welcome: { en: "Let's find your starting level", bn: "আপনার শুরুর মাত্রা খুঁজি" },
  diagnostic_intro: { en: "Quick 20-question diagnostic", bn: "দ্রুত ২০ প্রশ্নের পরীক্ষা" },
  your_first_plan: { en: "Your first 3-day plan", bn: "আপনার প্রথম ৩ দিনের পরিকল্পনা" },
  get_started: { en: "Get Started", bn: "শুরু করুন" },
  continue_btn: { en: "Continue", bn: "চালিয়ে যান" },

  // Progress
  progress: { en: "Progress", bn: "অগ্রগতি" },
  exam_history: { en: "Exam History", bn: "পরীক্ষার ইতিহাস" },
  score_trend: { en: "Score Trend", bn: "স্কোরের ধারা" },
  total_exams: { en: "Total Exams", bn: "মোট পরীক্ষা" },
  questions_answered: { en: "Questions Answered", bn: "উত্তর দেওয়া প্রশ্ন" },
  best_streak: { en: "Best Streak", bn: "সেরা ধারা" },
  cards_reviewed: { en: "Cards Reviewed", bn: "পর্যালোচিত কার্ড" },
  no_exams: { en: "No exams taken yet", bn: "এখনও কোন পরীক্ষা দেননি" },
  take_first: { en: "Take your first mock exam", bn: "আপনার প্রথম মক পরীক্ষা দিন" },

  // Auth
  sign_up: { en: "Create Account", bn: "অ্যাকাউন্ট তৈরি করুন" },
  sign_in: { en: "Sign In", bn: "প্রবেশ করুন" },
  create_account: { en: "Create your account", bn: "আপনার অ্যাকাউন্ট তৈরি করুন" },
  email: { en: "Email", bn: "ইমেইল" },
  password: { en: "Password", bn: "পাসওয়ার্ড" },
  name: { en: "Name", bn: "নাম" },
  phone: { en: "Phone", bn: "ফোন" },
  optional: { en: "optional", bn: "ঐচ্ছিক" },
  already_have: { en: "Already have an account?", bn: "ইতিমধ্যে অ্যাকাউন্ট আছে?" },
  dont_have: { en: "Don't have an account?", bn: "অ্যাকাউন্ট নেই?" },
  signing_in: { en: "Signing in...", bn: "প্রবেশ করা হচ্ছে..." },
  creating_account: { en: "Creating account...", bn: "অ্যাকাউন্ট তৈরি হচ্ছে..." },

  // Settings
  language: { en: "Language", bn: "ভাষা" },

  // Common
  loading: { en: "Loading...", bn: "লোড হচ্ছে..." },
  error: { en: "Something went wrong", bn: "কিছু ভুল হয়েছে" },
  retry: { en: "Try Again", bn: "আবার চেষ্টা করুন" },
  back: { en: "Back", bn: "পেছনে" },

  // Skill Tags
  skill_kana_recognition: { en: "Kana Recognition", bn: "কানা চিনতে পারা" },
  skill_kanji_reading: { en: "Kanji Reading", bn: "কাঞ্জি পঠন" },
  skill_word_meaning: { en: "Word Meaning", bn: "শব্দের অর্থ" },
  skill_vocab_usage: { en: "Vocab Usage", bn: "শব্দের ব্যবহার" },
  skill_particle: { en: "Particles", bn: "পার্টিকেল" },
  skill_verb_form: { en: "Verb Forms", bn: "ক্রিয়ার রূপ" },
  skill_adjective_form: { en: "Adjective Forms", bn: "বিশেষণের রূপ" },
  skill_sentence_completion: { en: "Sentence Completion", bn: "বাক্য পূরণ" },
  skill_sentence_order: { en: "Sentence Order", bn: "বাক্যের ক্রম" },
  skill_short_reading: { en: "Short Reading", bn: "সংক্ষিপ্ত পঠন" },
  skill_notice_reading: { en: "Notice Reading", bn: "নোটিশ পঠন" },
  skill_listening_gist: { en: "Listening (Main Idea)", bn: "শ্রবণ (মূল ভাব)" },
  skill_listening_detail: { en: "Listening (Detail)", bn: "শ্রবণ (বিস্তারিত)" },
  skill_listening_response: { en: "Listening (Response)", bn: "শ্রবণ (উত্তর)" },
  skill_listening_sequence: { en: "Listening (Sequence)", bn: "শ্রবণ (ক্রম)" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(
  key: TranslationKey,
  lang: Language,
  params?: Record<string, string | number>
): string {
  let text: string = translations[key]?.[lang] || translations[key]?.["en"] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export function getSkillLabel(skillTag: string, lang: Language): string {
  const key = `skill_${skillTag}` as TranslationKey;
  if (key in translations) {
    return t(key, lang);
  }
  return skillTag.replace(/_/g, " ");
}
