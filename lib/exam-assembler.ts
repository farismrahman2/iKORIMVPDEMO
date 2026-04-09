import { createSupabaseServerClient } from "./supabase";
import type {
  Question,
  ExamType,
  SectionType,
  DifficultyLevel,
  FrequencyTier,
  ExamBlueprint,
} from "@/types";

const BLUEPRINTS: Record<ExamType, ExamBlueprint> = {
  full: {
    exam_type: "full",
    total_questions: 75,
    time_limit_sec: 4500,
    sections: [
      { section: "vocab", count: 25 },
      { section: "grammar_reading", count: 30 },
      { section: "listening", count: 20 },
    ],
    difficulty_split: { easy: 0.3, medium: 0.5, hard: 0.2 },
    frequency_split: { high: 0.6, medium: 0.25, stretch: 0.15 },
  },
  section: {
    exam_type: "section",
    total_questions: 0,
    time_limit_sec: 0,
    sections: [],
    difficulty_split: { easy: 0.3, medium: 0.5, hard: 0.2 },
    frequency_split: { high: 0.6, medium: 0.25, stretch: 0.15 },
  },
  speed: {
    exam_type: "speed",
    total_questions: 25,
    time_limit_sec: 900,
    sections: [
      { section: "vocab", count: 9 },
      { section: "grammar_reading", count: 10 },
      { section: "listening", count: 6 },
    ],
    difficulty_split: { easy: 0.4, medium: 0.4, hard: 0.2 },
    frequency_split: { high: 1.0, medium: 0, stretch: 0 },
  },
  diagnostic: {
    exam_type: "diagnostic",
    total_questions: 20,
    time_limit_sec: 1500,
    sections: [
      { section: "vocab", count: 8 },
      { section: "grammar_reading", count: 8 },
      { section: "listening", count: 4 },
    ],
    difficulty_split: { easy: 0.3, medium: 0.5, hard: 0.2 },
    frequency_split: { high: 0.6, medium: 0.25, stretch: 0.15 },
  },
};

const SECTION_CONFIGS: Record<SectionType, { count: number; time: number }> = {
  vocab: { count: 25, time: 1200 },
  grammar_reading: { count: 30, time: 1500 },
  listening: { count: 20, time: 1200 },
};

function getBlueprint(examType: ExamType, sectionFilter?: SectionType): ExamBlueprint {
  if (examType === "section" && sectionFilter) {
    const config = SECTION_CONFIGS[sectionFilter];
    return {
      exam_type: "section",
      section_filter: sectionFilter,
      total_questions: config.count,
      time_limit_sec: config.time,
      sections: [{ section: sectionFilter, count: config.count }],
      difficulty_split: { easy: 0.3, medium: 0.5, hard: 0.2 },
      frequency_split: { high: 0.6, medium: 0.25, stretch: 0.15 },
    };
  }
  return BLUEPRINTS[examType];
}

function distributeByDifficulty(
  count: number,
  split: Record<DifficultyLevel, number>
): Record<DifficultyLevel, number> {
  const easy = Math.round(count * split.easy);
  const hard = Math.round(count * split.hard);
  const medium = count - easy - hard;
  return { easy, medium, hard };
}

function distributeByFrequency(
  count: number,
  split: Record<FrequencyTier, number>
): Record<FrequencyTier, number> {
  const high = Math.round(count * split.high);
  const stretch = Math.round(count * split.stretch);
  const medium = count - high - stretch;
  return { high, medium, stretch };
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function enforceSubtypeSpacing(questions: Question[]): Question[] {
  const result: Question[] = [];
  const remaining = [...questions];

  while (remaining.length > 0) {
    const recentSubtypes = result.slice(-2).map((q) => q.subtype);
    const allSameSubtype = recentSubtypes.length === 2 && recentSubtypes[0] === recentSubtypes[1];

    if (allSameSubtype) {
      const differentIdx = remaining.findIndex((q) => q.subtype !== recentSubtypes[0]);
      if (differentIdx >= 0) {
        result.push(remaining.splice(differentIdx, 1)[0]);
      } else {
        result.push(remaining.shift()!);
      }
    } else {
      result.push(remaining.shift()!);
    }
  }

  return result;
}

export async function assembleExam(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  examType: ExamType,
  userId: string,
  sectionFilter?: SectionType
): Promise<{ blueprint: ExamBlueprint; questions: Question[] }> {
  const supabase = createSupabaseServerClient(cookieStore);
  const blueprint = getBlueprint(examType, sectionFilter);

  // Get question IDs from user's last 2 exams to exclude
  const { data: recentSessions } = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(2);

  let excludeIds: string[] = [];
  if (recentSessions && recentSessions.length > 0) {
    const sessionIds = recentSessions.map((s: { id: string }) => s.id);
    const { data: recentResponses } = await supabase
      .from("exam_responses")
      .select("question_id")
      .in("session_id", sessionIds);
    if (recentResponses) {
      excludeIds = recentResponses.map((r: { question_id: string }) => r.question_id);
    }
  }

  const allQuestions: Question[] = [];

  for (const sectionDef of blueprint.sections) {
    const difficultySplit = distributeByDifficulty(sectionDef.count, blueprint.difficulty_split);
    const frequencySplit = distributeByFrequency(sectionDef.count, blueprint.frequency_split);

    let query = supabase
      .from("questions")
      .select("*")
      .eq("section", sectionDef.section)
      .eq("validated", true);

    if (excludeIds.length > 0) {
      // Sanitize: only keep valid UUID-formatted strings
      const safeIds = excludeIds.filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      );
      if (safeIds.length > 0) {
        query = query.not("id", "in", `(${safeIds.join(",")})`);
      }
    }

    const { data: sectionQuestions, error } = await query;
    if (error) {
      console.error(`Failed to fetch ${sectionDef.section} questions:`, error);
      continue;
    }
    if (!sectionQuestions || sectionQuestions.length === 0) continue;

    // Score and select questions by difficulty and frequency targets
    const selected = selectQuestions(
      sectionQuestions as Question[],
      sectionDef.count,
      difficultySplit,
      frequencySplit
    );
    allQuestions.push(...selected);
  }

  const shuffled = shuffle(allQuestions);
  const spaced = enforceSubtypeSpacing(shuffled);

  return { blueprint, questions: spaced };
}

function selectQuestions(
  pool: Question[],
  targetCount: number,
  difficultySplit: Record<DifficultyLevel, number>,
  frequencySplit: Record<FrequencyTier, number>
): Question[] {
  const selected: Question[] = [];
  const used = new Set<string>();

  // First pass: try to match both difficulty and frequency targets
  for (const difficulty of ["easy", "medium", "hard"] as DifficultyLevel[]) {
    const targetDiff = difficultySplit[difficulty];
    const matching = pool.filter(
      (q) => q.difficulty === difficulty && !used.has(q.id)
    );

    // Within difficulty, prioritize by frequency tier
    for (const tier of ["high", "medium", "stretch"] as FrequencyTier[]) {
      const tierTarget = Math.round(targetDiff * (frequencySplit[tier] / 1));
      const tierMatching = matching.filter((q) => q.frequency_tier === tier && !used.has(q.id));
      const shuffledTier = shuffle(tierMatching);

      for (let i = 0; i < Math.min(tierTarget, shuffledTier.length); i++) {
        if (selected.length >= targetCount) break;
        selected.push(shuffledTier[i]);
        used.add(shuffledTier[i].id);
      }
    }

    // Fill remaining difficulty slots from any frequency tier
    const remaining = matching.filter((q) => !used.has(q.id));
    const shuffledRemaining = shuffle(remaining);
    for (const q of shuffledRemaining) {
      if (selected.filter((s) => s.difficulty === difficulty).length >= targetDiff) break;
      if (selected.length >= targetCount) break;
      selected.push(q);
      used.add(q.id);
    }
  }

  // Second pass: fill any remaining slots from unused questions
  if (selected.length < targetCount) {
    const unused = pool.filter((q) => !used.has(q.id));
    const shuffledUnused = shuffle(unused);
    for (const q of shuffledUnused) {
      if (selected.length >= targetCount) break;
      selected.push(q);
      used.add(q.id);
    }
  }

  return selected.slice(0, targetCount);
}

export { getBlueprint, BLUEPRINTS };
