"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export default function ExamTimer({
  totalSeconds,
  onTimeUp,
  isPaused = false,
}: ExamTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  const handleTimeUp = useCallback(() => {
    onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    if (isPaused || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remaining, handleTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 300 && remaining > 60;
  const isCritical = remaining <= 60;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold transition-colors ${
        isCritical
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : isWarning
          ? "bg-yellow-500/20 text-yellow-400"
          : "bg-navy-light text-gray-300"
      }`}
    >
      <Clock size={16} />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
