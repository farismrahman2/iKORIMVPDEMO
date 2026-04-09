"use client";

import type { Question } from "@/types";
import AudioPlayer from "@/components/listening/AudioPlayer";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelect: (answerIdx: number) => void;
  onSkip: () => void;
  showResult?: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  onSkip,
  showResult = false,
}: QuestionCardProps) {
  const options = question.options as string[];

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div>
        <p className="text-lg leading-relaxed text-ikori-dark" style={{ fontSize: "1.2rem" }}>
          {question.question_text}
        </p>
        {question.section === "listening" && question.audio_url && (
          <div className="mt-4">
            <AudioPlayer
              src={question.audio_url}
              examMode={!showResult}
              questionId={question.id}
            />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, idx) => {
          let className =
            "w-full text-left p-4 rounded-ikori-sm text-sm active:scale-[0.98] transition-all min-h-[52px] flex items-center ";

          if (showResult) {
            if (idx === question.correct_answer) {
              className += "border border-green-300 bg-green-50 text-green-800";
            } else if (idx === selectedAnswer && idx !== question.correct_answer) {
              className += "border border-red-300 bg-red-50 text-red-700";
            } else {
              className += "border border-ikori-border bg-white text-ikori-muted";
            }
          } else if (selectedAnswer === idx) {
            className += "border-2 border-ikori-500 bg-ikori-50 font-medium text-ikori-dark";
          } else {
            className +=
              "border border-ikori-border bg-white text-ikori-dark hover:border-ikori-300";
          }

          return (
            <button
              key={idx}
              onClick={() => !showResult && onSelect(idx)}
              disabled={showResult}
              className={className}
            >
              <span className="text-ikori-muted font-medium mr-2">
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ fontSize: "1.1rem" }}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Skip button */}
      {!showResult && (
        <button
          onClick={onSkip}
          className="text-sm text-ikori-muted hover:text-ikori-body transition-colors"
        >
          Skip this question
        </button>
      )}

      {/* Explanation (shown in review mode) */}
      {showResult && (
        <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 space-y-2">
          <p className="text-sm text-ikori-body">{question.explanation_en}</p>
          <p className="text-sm text-ikori-muted">{question.explanation_bn}</p>
        </div>
      )}
    </div>
  );
}
