"use client";

import type { Mission } from "@/types";
import { useRouter } from "next/navigation";
import {
  Layers,
  BookOpen,
  Headphones,
  FileText,
  CheckCircle,
  PenLine,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

interface DailyMissionsProps {
  missions: Mission[];
}

const MISSION_ICONS: Record<string, typeof Layers> = {
  flashcard_session: Layers,
  vocab_drill: BookOpen,
  listening_quiz: Headphones,
  grammar_drill: PenLine,
  mock_exam: FileText,
};

const MISSION_ROUTES: Record<string, string> = {
  flashcard_session: "/flashcards",
  vocab_drill: "/vocab",
  listening_quiz: "/listening",
  grammar_drill: "/vocab",
  mock_exam: "/exam",
};

const MISSION_TITLE_KEYS: Record<string, TranslationKey> = {
  flashcard_session: "flashcard_session",
  vocab_drill: "vocab_drill",
  listening_quiz: "listening_quiz",
  grammar_drill: "grammar_drill",
  mock_exam: "mock_exam",
};

export default function DailyMissions({ missions }: DailyMissionsProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const completed = missions.filter((m) => m.completed).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">
          {t('todays_missions')}
        </h3>
        <span className="text-xs text-ikori-500 font-medium">
          {t('of_complete', { done: completed, total: missions.length })}
        </span>
      </div>

      <div className="space-y-2">
        {missions.map((mission) => {
          const Icon = MISSION_ICONS[mission.type] || FileText;

          return (
            <button
              key={mission.id}
              onClick={() => router.push(MISSION_ROUTES[mission.type] || "/dashboard")}
              className={`w-full flex items-center gap-3 p-3 rounded-ikori-sm transition-colors ${
                mission.completed
                  ? "bg-ikori-50 border border-ikori-200"
                  : "bg-white hover:bg-ikori-surface border border-ikori-border"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  mission.completed
                    ? "bg-ikori-100 text-ikori-600"
                    : "bg-ikori-50 text-ikori-500"
                }`}
              >
                {mission.completed ? (
                  <CheckCircle size={18} strokeWidth={1.5} />
                ) : (
                  <Icon size={18} strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-medium ${
                    mission.completed ? "text-ikori-muted line-through" : "text-ikori-dark"
                  }`}
                >
                  {MISSION_TITLE_KEYS[mission.type] ? t(MISSION_TITLE_KEYS[mission.type]) : mission.title}
                </p>
                <p className="text-xs text-ikori-muted">
                  {mission.question_count} {t('items')} | ~{mission.estimated_minutes} {t('min')}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
