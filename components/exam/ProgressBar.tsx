"use client";

import type { SectionType } from "@/types";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

interface ProgressBarProps {
  current: number;
  total: number;
  currentSection?: SectionType;
  sections?: { section: SectionType; count: number }[];
}

const SECTION_LABEL_KEYS: Record<SectionType, TranslationKey> = {
  vocab: "vocabulary",
  grammar_reading: "grammar_reading",
  listening: "listening",
};

export default function ProgressBar({
  current,
  total,
  currentSection,
  sections,
}: ProgressBarProps) {
  const { t } = useLanguage();
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-ikori-muted">
          {t('question_of', { n: current, total })}
        </span>
        {currentSection && (
          <span className="text-ikori-500 text-xs font-medium">
            {t(SECTION_LABEL_KEYS[currentSection])}
          </span>
        )}
      </div>

      <div className="h-[3px] bg-ikori-100 rounded-full overflow-hidden relative">
        {sections ? (
          // Multi-section progress bar
          <div className="flex h-full">
            {sections.map((s, i) => {
              const sectionStart = sections
                .slice(0, i)
                .reduce((sum, sec) => sum + sec.count, 0);
              const sectionWidth = (s.count / total) * 100;
              const filled = Math.min(
                100,
                Math.max(0, ((current - sectionStart) / s.count) * 100)
              );

              return (
                <div
                  key={s.section}
                  className="h-full relative"
                  style={{ width: `${sectionWidth}%` }}
                >
                  <div
                    className="h-full bg-ikori-500 rounded-full transition-all duration-300"
                    style={{
                      width: current > sectionStart ? `${Math.min(filled, 100)}%` : "0%",
                    }}
                  />
                  {i > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-ikori-200" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Simple progress bar
          <div
            className="h-full bg-ikori-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
