"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamType, SectionType } from "@/types";
import { Clock, Zap, FileText, BookOpen, PenLine, Headphones } from "lucide-react";

interface ExamOption {
  type: ExamType;
  section?: SectionType;
  label: string;
  description: string;
  questions: number;
  minutes: number;
  icon: typeof FileText;
  color: string;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    type: "full",
    label: "Full Mock",
    description: "Complete JLPT N5 simulation",
    questions: 75,
    minutes: 75,
    icon: FileText,
    color: "bg-accent-orange/10 text-accent-orange border-accent-orange/30",
  },
  {
    type: "section",
    section: "vocab",
    label: "Vocab Only",
    description: "Vocabulary section practice",
    questions: 25,
    minutes: 20,
    icon: BookOpen,
    color: "bg-band-probable/10 text-band-probable border-band-probable/30",
  },
  {
    type: "section",
    section: "grammar_reading",
    label: "Grammar Only",
    description: "Grammar & reading section",
    questions: 30,
    minutes: 25,
    icon: PenLine,
    color: "bg-accent-gold/10 text-accent-gold border-accent-gold/30",
  },
  {
    type: "section",
    section: "listening",
    label: "Listening Only",
    description: "Listening section practice",
    questions: 20,
    minutes: 20,
    icon: Headphones,
    color: "bg-band-strong/10 text-band-strong border-band-strong/30",
  },
  {
    type: "speed",
    label: "Speed Drill",
    description: "25 high-frequency items, fast pace",
    questions: 25,
    minutes: 15,
    icon: Zap,
    color: "bg-band-borderline/10 text-band-borderline border-band-borderline/30",
  },
];

export default function ExamPage() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function startExam(option: ExamOption) {
    setCreating(true);

    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_type: option.type,
          section_filter: option.section,
        }),
      });

      const data = await res.json();
      if (data.session?.id) {
        router.push(`/exam/${data.session.id}`);
      }
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Start Exam</h1>
      <p className="text-gray-400 text-sm mb-6">
        Choose an exam type to begin practicing
      </p>

      <div className="space-y-3">
        {EXAM_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.label}
              onClick={() => startExam(option)}
              disabled={creating}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-colors hover:opacity-80 disabled:opacity-50 ${option.color}`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5">
                <Icon size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{option.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{option.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs opacity-60">
                  <span>{option.questions} questions</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {option.minutes} min
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-navy-light rounded-xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-accent-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-300">Preparing your exam...</p>
          </div>
        </div>
      )}
    </div>
  );
}
