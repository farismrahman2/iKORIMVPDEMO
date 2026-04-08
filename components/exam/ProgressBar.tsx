"use client";

import type { SectionType } from "@/types";

interface ProgressBarProps {
  current: number;
  total: number;
  currentSection?: SectionType;
  sections?: { section: SectionType; count: number }[];
}

const SECTION_LABELS: Record<SectionType, string> = {
  vocab: "Vocabulary",
  grammar_reading: "Grammar & Reading",
  listening: "Listening",
};

export default function ProgressBar({
  current,
  total,
  currentSection,
  sections,
}: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">
          {current} / {total}
        </span>
        {currentSection && (
          <span className="text-accent-gold text-xs font-medium">
            {SECTION_LABELS[currentSection]}
          </span>
        )}
      </div>

      <div className="h-2 bg-navy-light rounded-full overflow-hidden relative">
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
                    className="h-full bg-accent-orange rounded-full transition-all duration-300"
                    style={{
                      width: current > sectionStart ? `${Math.min(filled, 100)}%` : "0%",
                    }}
                  />
                  {i > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-navy-lighter" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Simple progress bar
          <div
            className="h-full bg-accent-orange rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
