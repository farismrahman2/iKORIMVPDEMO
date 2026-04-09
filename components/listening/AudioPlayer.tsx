"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";

interface AudioPlayerProps {
  src: string;
  examMode?: boolean;
  maxReplays?: number;
  onError?: () => void;
  questionId?: string;
}

export default function AudioPlayer({
  src,
  examMode = false,
  maxReplays = 2,
  onError,
  questionId,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlayCount((c) => c + 1);
    };

    const handleError = async () => {
      setLoading(false);
      setError(true);
      // Log error to listening_errors table
      try {
        const supabase = createClientComponentClient();
        await supabase.from("listening_errors").insert({
          question_id: questionId || null,
          audio_url: src,
          error_type: "playback_error",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        });
      } catch {
        // Silently fail error logging
      }
      onError?.();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      // Stop playback on unmount
      audio.pause();
      audio.currentTime = 0;
    };
  }, [src, onError, questionId]);

  const canPlay = !examMode || playCount < maxReplays;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setLoading(true);
      audio.playbackRate = speed;
      audio.play().then(() => {
        setLoading(false);
        setIsPlaying(true);
      }).catch(() => {
        setLoading(false);
        setError(true);
      });
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (examMode) return;
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  }

  function toggleSpeed() {
    const newSpeed = speed === 1.0 ? 0.85 : 1.0;
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 text-center">
        <p className="text-red-500 text-sm font-sans">Audio unavailable</p>
        <button
          onClick={() => {
            setError(false);
            setPlayCount(0);
          }}
          className="text-ikori-500 text-sm mt-2 hover:underline font-sans"
        >
          <RotateCcw size={14} className="inline mr-1" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!canPlay || loading}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            canPlay
              ? "bg-ikori-500 hover:bg-ikori-400 text-white"
              : "bg-ikori-100 text-ikori-muted cursor-not-allowed"
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* Progress bar */}
        <div
          className={`flex-1 h-2 bg-ikori-50 rounded-full overflow-hidden ${
            examMode ? "" : "cursor-pointer"
          }`}
          onClick={handleSeek}
        >
          <div
            className="h-full bg-ikori-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Speed control */}
        <button
          onClick={toggleSpeed}
          className="text-xs text-ikori-muted hover:text-ikori-dark px-2 py-1 rounded-ikori-sm border border-ikori-border font-sans"
        >
          {speed}x
        </button>
      </div>

      {/* Play count indicator */}
      {examMode && (
        <p className="text-xs text-ikori-muted mt-2 text-center font-sans">
          {playCount} / {maxReplays} plays used
        </p>
      )}

      {/* Duration */}
      {duration > 0 && (
        <p className="text-xs text-ikori-muted mt-1 text-center font-sans">
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
