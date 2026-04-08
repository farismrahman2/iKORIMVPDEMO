import type {
  ExamResponse,
  Question,
  DifficultyLevel,
  SectionType,
  ReadinessBand,
  SkillScore,
  SkillTag,
  ExamResult,
} from "@/types";

const SECTION_WEIGHTS: Record<SectionType, number> = {
  vocab: 0.3,
  grammar_reading: 0.4,
  listening: 0.3,
};

const DIFFICULTY_WEIGHTS: Record<DifficultyLevel, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

function calculateSectionAccuracy(
  responses: ExamResponse[],
  questions: Question[],
  section: SectionType
): number {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const sectionResponses = responses.filter((r) => {
    const q = questionMap.get(r.question_id);
    return q && q.section === section;
  });

  if (sectionResponses.length === 0) return 0;

  const correct = sectionResponses.filter((r) => r.is_correct).length;
  return (correct / sectionResponses.length) * 100;
}

function calculateWeightedScore(
  responses: ExamResponse[],
  questions: Question[]
): number {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let totalWeightedCorrect = 0;
  let totalWeightedPossible = 0;

  for (const response of responses) {
    const question = questionMap.get(response.question_id);
    if (!question) continue;

    const diffWeight = DIFFICULTY_WEIGHTS[question.difficulty];
    const sectionWeight = SECTION_WEIGHTS[question.section];
    const weight = diffWeight * sectionWeight;

    totalWeightedPossible += weight;
    if (response.is_correct) {
      totalWeightedCorrect += weight;
    }
  }

  if (totalWeightedPossible === 0) return 0;
  return (totalWeightedCorrect / totalWeightedPossible) * 100;
}

function determineReadinessBand(weightedScore: number): ReadinessBand {
  if (weightedScore >= 79) return "strong";
  if (weightedScore >= 68) return "probable";
  if (weightedScore >= 55) return "borderline";
  return "high_risk";
}

function calculateSkillScores(
  responses: ExamResponse[],
  questions: Question[]
): SkillScore[] {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const skillMap = new Map<SkillTag, { correct: number; total: number }>();

  for (const response of responses) {
    const question = questionMap.get(response.question_id);
    if (!question) continue;

    const tag = question.skill_tag as SkillTag;
    if (!skillMap.has(tag)) {
      skillMap.set(tag, { correct: 0, total: 0 });
    }

    const skill = skillMap.get(tag)!;
    skill.total++;
    if (response.is_correct) {
      skill.correct++;
    }
  }

  return Array.from(skillMap.entries()).map(([skill_tag, { correct, total }]) => ({
    skill_tag,
    correct,
    total,
    percentage: total > 0 ? (correct / total) * 100 : 0,
  }));
}

export function scoreExam(
  sessionId: string,
  responses: ExamResponse[],
  questions: Question[]
): ExamResult {
  const vocabScore = calculateSectionAccuracy(responses, questions, "vocab");
  const grammarScore = calculateSectionAccuracy(responses, questions, "grammar_reading");
  const listeningScore = calculateSectionAccuracy(responses, questions, "listening");

  const overallCorrect = responses.filter((r) => r.is_correct).length;
  const overallScore = responses.length > 0 ? (overallCorrect / responses.length) * 100 : 0;

  const weightedScore = calculateWeightedScore(responses, questions);
  const readinessBand = determineReadinessBand(weightedScore);
  const skillScores = calculateSkillScores(responses, questions);

  return {
    session_id: sessionId,
    section_scores: {
      vocab: vocabScore,
      grammar_reading: grammarScore,
      listening: listeningScore,
    },
    weighted_score: weightedScore,
    overall_score: overallScore,
    readiness_band: readinessBand,
    skill_scores: skillScores,
  };
}

export { SECTION_WEIGHTS, DIFFICULTY_WEIGHTS, determineReadinessBand };
