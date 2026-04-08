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
        <p className="text-lg leading-relaxed text-white" style={{ fontSize: "1.2rem" }}>
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
            "w-full text-left px-4 py-3 rounded-lg border transition-colors ";

          if (showResult) {
            if (idx === question.correct_answer) {
              className += "border-green-500 bg-green-500/10 text-green-400";
            } else if (idx === selectedAnswer && idx !== question.correct_answer) {
              className += "border-red-500 bg-red-500/10 text-red-400";
            } else {
              className += "border-navy-lighter bg-navy-light text-gray-500";
            }
          } else if (selectedAnswer === idx) {
            className += "border-accent-orange bg-accent-orange/10 text-white";
          } else {
            className +=
              "border-navy-lighter bg-navy-light text-gray-300 hover:border-gray-500";
          }

          return (
            <button
              key={idx}
              onClick={() => !showResult && onSelect(idx)}
              disabled={showResult}
              className={className}
            >
              <span className="font-medium mr-3 text-gray-500">
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
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip this question
        </button>
      )}

      {/* Explanation (shown in review mode) */}
      {showResult && (
        <div className="bg-navy-light rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-300">{question.explanation_en}</p>
          <p className="text-sm text-gray-500">{question.explanation_bn}</p>
        </div>
      )}
    </div>
  );
}
