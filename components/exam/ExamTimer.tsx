"use client";

import { useEffect, useRef, useState } from "react";
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
  const onTimeUpRef = useRef(onTimeUp);
  const firedRef = useRef(false);

  // Keep callback ref up to date without causing re-renders
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isPaused || firedRef.current) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!firedRef.current) {
            firedRef.current = true;
            // Defer callback to avoid calling during state update
            setTimeout(() => onTimeUpRef.current(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 300 && remaining > 60;
  const isCritical = remaining <= 60;
  const progressPercent = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-semibold transition-colors bg-white border shadow-ikori-sm ${
          isCritical
            ? "border-red-300 text-red-500 animate-pulse"
            : isWarning
            ? "border-amber-300 text-amber-500"
            : "border-ikori-border text-ikori-dark"
        }`}
      >
        <Clock size={16} />
        <span>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      {/* Thin progress bar */}
      <div className="flex-1 h-[3px] bg-ikori-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-ikori-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
