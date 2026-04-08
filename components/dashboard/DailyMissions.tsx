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

interface DailyMissionsProps {
  missions: Mission[];
}

const MISSION_ICONS: Record<string, typeof Layers> = {
  flashcards: Layers,
  vocab_drill: BookOpen,
  listening_quiz: Headphones,
  grammar_drill: PenLine,
  mock_exam: FileText,
};

const MISSION_ROUTES: Record<string, string> = {
  flashcards: "/flashcards",
  vocab_drill: "/vocab",
  listening_quiz: "/listening",
  grammar_drill: "/vocab",
  mock_exam: "/exam",
};

export default function DailyMissions({ missions }: DailyMissionsProps) {
  const router = useRouter();
  const completed = missions.filter((m) => m.completed).length;

  return (
    <div className="bg-navy-light rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Today&apos;s Missions
        </h3>
        <span className="text-xs text-accent-gold">
          {completed} of {missions.length} complete
        </span>
      </div>

      <div className="space-y-2">
        {missions.map((mission) => {
          const Icon = MISSION_ICONS[mission.type] || FileText;

          return (
            <button
              key={mission.id}
              onClick={() => router.push(MISSION_ROUTES[mission.type] || "/dashboard")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                mission.completed
                  ? "bg-band-strong/10 border border-band-strong/20"
                  : "bg-navy hover:bg-navy-lighter border border-navy-lighter"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  mission.completed
                    ? "bg-band-strong/20 text-band-strong"
                    : "bg-accent-orange/20 text-accent-orange"
                }`}
              >
                {mission.completed ? (
                  <CheckCircle size={16} />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-medium ${
                    mission.completed ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {mission.title}
                </p>
                <p className="text-xs text-gray-500">
                  {mission.question_count} items | ~{mission.estimated_minutes} min
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
