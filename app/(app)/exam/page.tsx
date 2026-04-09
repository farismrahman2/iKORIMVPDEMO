"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import type { ExamType, SectionType } from "@/types";
import { Clock, Zap, FileText, BookOpen, PenLine, Headphones } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface ExamOption {
  type: ExamType;
  section?: SectionType;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  questions: number;
  minutes: number;
  icon: typeof FileText;
  iconColor: string;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    type: "full",
    labelKey: "full_mock",
    descriptionKey: "complete_jlpt",
    questions: 75,
    minutes: 75,
    icon: FileText,
    iconColor: "text-ikori-500",
  },
  {
    type: "section",
    section: "vocab",
    labelKey: "vocab_only",
    descriptionKey: "vocab_section",
    questions: 25,
    minutes: 20,
    icon: BookOpen,
    iconColor: "text-blue-500",
  },
  {
    type: "section",
    section: "grammar_reading",
    labelKey: "grammar_only",
    descriptionKey: "grammar_section",
    questions: 30,
    minutes: 25,
    icon: PenLine,
    iconColor: "text-amber-500",
  },
  {
    type: "section",
    section: "listening",
    labelKey: "listening_only",
    descriptionKey: "listening_section",
    questions: 20,
    minutes: 20,
    icon: Headphones,
    iconColor: "text-ikori-600",
  },
  {
    type: "speed",
    labelKey: "speed_drill",
    descriptionKey: "speed_desc",
    questions: 25,
    minutes: 15,
    icon: Zap,
    iconColor: "text-amber-500",
  },
];

export default function ExamPage() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

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
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-display font-bold text-ikori-dark mb-2">{t('start_exam')}</h1>
      <p className="text-ikori-muted text-sm mb-6">
        {t('choose_exam')}
      </p>

      <div className="space-y-3">
        {EXAM_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.labelKey}
              onClick={() => startExam(option)}
              disabled={creating}
              className="w-full flex items-start gap-4 bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 transition-all active:scale-[0.98] hover:shadow-ikori disabled:opacity-50"
            >
              <div className={`w-10 h-10 rounded-ikori-sm flex items-center justify-center bg-ikori-50 ${option.iconColor}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-ikori-dark">{t(option.labelKey)}</p>
                <p className="text-xs text-ikori-muted mt-0.5">{t(option.descriptionKey)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-ikori-muted">
                  <span>{option.questions} {t('questions')}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {option.minutes} {t('min')}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-ikori shadow-ikori-md p-6 text-center">
            <div className="w-8 h-8 border-2 border-ikori-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-ikori-body">{t('preparing_exam')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
