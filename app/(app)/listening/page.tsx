"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import AudioPlayer from "@/components/listening/AudioPlayer";
import TranscriptUnlock from "@/components/listening/TranscriptUnlock";
import type { Question, SkillTag } from "@/types";
import { CheckCircle, XCircle } from "lucide-react";
import UpgradePrompt from "@/components/UpgradePrompt";

type ListeningMode = "mcq" | "sequence" | "fill_blank" | "choose_reply" | "transcript";

const MODE_SKILL_MAP: Record<ListeningMode, SkillTag> = {
  mcq: "listening_gist",
  sequence: "listening_sequence",
  fill_blank: "listening_detail",
  choose_reply: "listening_response",
  transcript: "listening_gist",
};

export default function ListeningPage() {
  const { t, lang } = useLanguage();

  const MODES: { key: ListeningMode; label: string }[] = [
    { key: "mcq", label: t('standard_mcq') },
    { key: "sequence", label: t('sequence') },
    { key: "fill_blank", label: t('fill_blank_mode') },
    { key: "choose_reply", label: t('choose_reply') },
    { key: "transcript", label: t('transcript_mode') },
  ];

  const [mode, setMode] = useState<ListeningMode>("mcq");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sequenceOrder, setSequenceOrder] = useState<number[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetch("/api/access/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "listening" }),
    })
      .then((r) => r.json())
      .then((d) => { if (!d.allowed) setShowUpgrade(true); })
      .catch(() => {});
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const skillTag = MODE_SKILL_MAP[mode];

    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("section", "listening")
      .eq("validated", true)
      .eq("skill_tag", skillTag)
      .limit(10);

    if (data && data.length > 0) {
      const shuffled = [...(data as Question[])].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, 8));
      setCurrentIdx(0);
      setCorrect(0);
      setTotal(0);
      setSelected(null);
      setShowResult(false);
      setSessionDone(false);
      setSequenceOrder([]);
    } else {
      setQuestions([]);
    }
    setLoading(false);
  }, [supabase, mode]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function handleSelect(idx: number) {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    setTotal((t) => t + 1);

    const question = questions[currentIdx];
    if (idx === question.correct_answer) {
      setCorrect((c) => c + 1);
    }
  }

  function handleSequenceSelect(idx: number) {
    if (showResult) return;
    if (sequenceOrder.includes(idx)) {
      setSequenceOrder((prev) => prev.filter((i) => i !== idx));
    } else {
      const newOrder = [...sequenceOrder, idx];
      setSequenceOrder(newOrder);

      if (newOrder.length === 4) {
        setShowResult(true);
        setTotal((t) => t + 1);
        // Check if order matches correct answer pattern (0,1,2,3)
        const isCorrect = newOrder.every((v, i) => v === i);
        if (isCorrect) {
          setCorrect((c) => c + 1);
        }
      }
    }
  }

  function nextQuestion() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      setSessionDone(true);
      return;
    }
    setCurrentIdx(nextIdx);
    setSelected(null);
    setShowResult(false);
    setSequenceOrder([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted font-sans">Loading listening exercises...</div>
      </div>
    );
  }

  if (showUpgrade) {
    return (
      <>
        <div className="px-4 py-6 bg-ikori-white min-h-screen">
          <h1 className="text-2xl font-bold font-display text-ikori-dark mb-4">{t('listening')}</h1>
          <p className="text-ikori-muted text-sm">You&apos;ve used your free listening session this week.</p>
        </div>
        <UpgradePrompt
          isOpen={true}
          onClose={() => setShowUpgrade(false)}
          module="listening"
          limit={1}
        />
      </>
    );
  }

  if (sessionDone) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <ListeningSessionComplete pct={pct} correct={correct} total={total} onPracticeAgain={loadQuestions} t={t} />
    );
  }

  const question = questions[currentIdx];

  if (!question) {
    return (
      <div className="px-4 py-6 bg-ikori-white min-h-screen">
        <h1 className="text-2xl font-bold font-display text-ikori-dark mb-4">{t('listening')}</h1>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors font-sans ${
                mode === m.key
                  ? "bg-ikori-500 text-white"
                  : "bg-ikori-50 text-ikori-body"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="text-center py-12 text-ikori-muted font-sans">
          {t('no_listening')}
        </div>
      </div>
    );
  }

  const options = question.options as string[];

  return (
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-bold font-display text-ikori-dark mb-4">{t('listening')}</h1>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors font-sans ${
              mode === m.key
                ? "bg-ikori-500 text-white"
                : "bg-ikori-50 text-ikori-body"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex justify-between text-sm text-ikori-muted mb-4 font-sans">
        <span>
          {t('clip_of', { n: currentIdx + 1, total: questions.length })}
        </span>
        <span>
          {correct} / {total} {t('correct')}
        </span>
      </div>

      {/* Audio player */}
      <div className="mb-6">
        {question.audio_url ? (
          <AudioPlayer
            src={question.audio_url}
            examMode={false}
            questionId={question.id}
          />
        ) : question.audio_script ? (
          <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4 text-center">
            <p className="text-ikori-muted text-sm mb-2 font-sans">{t('audio_not_available')}</p>
            <p className="text-ikori-dark text-sm italic font-sans">{question.audio_script}</p>
          </div>
        ) : null}
      </div>

      {/* Question */}
      <p className="text-lg text-ikori-dark mb-4 font-sans" style={{ fontSize: "1.1rem" }}>
        {question.question_text}
      </p>

      {/* Mode-specific answer UI */}
      {mode === "sequence" ? (
        // Sequence mode — numbered selection
        <div className="space-y-3 mb-6">
          {options.map((option, idx) => {
            const orderNum = sequenceOrder.indexOf(idx);
            const isSelected = orderNum >= 0;

            return (
              <button
                key={idx}
                onClick={() => handleSequenceSelect(idx)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-ikori-sm border text-sm active:scale-[0.98] transition-all flex items-center gap-3 font-sans ${
                  showResult
                    ? sequenceOrder.indexOf(idx) === idx
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-ikori-border bg-ikori-surface text-ikori-muted"
                    : isSelected
                    ? "border-ikori-500 bg-ikori-50 text-ikori-dark"
                    : "border-ikori-border bg-white text-ikori-dark hover:border-ikori-300"
                }`}
              >
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-ikori-500 text-white flex items-center justify-center text-sm font-bold">
                    {orderNum + 1}
                  </span>
                )}
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        // Standard MCQ mode (mcq, fill_blank, choose_reply, transcript)
        <div className="space-y-3 mb-6">
          {options.map((option, idx) => {
            let className =
              "w-full text-left p-4 rounded-ikori-sm border text-sm active:scale-[0.98] transition-all flex items-center gap-3 font-sans ";

            if (showResult) {
              if (idx === question.correct_answer) {
                className += "border-green-300 bg-green-50 text-green-800";
              } else if (idx === selected && idx !== question.correct_answer) {
                className += "border-red-300 bg-red-50 text-red-700";
              } else {
                className += "border-ikori-border bg-ikori-surface text-ikori-muted";
              }
            } else {
              className +=
                "border-ikori-border bg-white text-ikori-dark hover:border-ikori-300";
            }

            return (
              <button key={idx} onClick={() => handleSelect(idx)} className={className}>
                <span className="font-medium text-ikori-muted w-6">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
                {showResult && idx === question.correct_answer && (
                  <CheckCircle size={18} className="ml-auto text-green-600" />
                )}
                {showResult && idx === selected && idx !== question.correct_answer && (
                  <XCircle size={18} className="ml-auto text-red-600" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation + Transcript (after answering) */}
      {showResult && (
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4">
            <p className="text-sm text-ikori-body font-sans">{lang === 'bn' ? question.explanation_bn : question.explanation_en}</p>
            <p className="text-sm text-ikori-muted mt-1 font-sans">{lang === 'bn' ? question.explanation_en : question.explanation_bn}</p>
          </div>

          {/* Transcript unlock for transcript mode */}
          {(mode === "transcript" || question.audio_script) && (
            <TranscriptUnlock
              script={question.audio_script || ""}
              translationBn={question.explanation_bn}
              unlocked={showResult}
              audioUrl={question.audio_url}
            />
          )}

          <button
            onClick={nextQuestion}
            className="btn-primary w-full py-3 rounded-ikori-sm font-semibold font-sans"
          >
            {currentIdx === questions.length - 1 ? t('finish') : t('next_clip')}
          </button>
        </div>
      )}
    </div>
  );
}

function ListeningSessionComplete({
  pct,
  correct,
  total,
  onPracticeAgain,
  t,
}: {
  pct: number;
  correct: number;
  total: number;
  onPracticeAgain: () => void;
  t: (key: import("@/lib/i18n").TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const missionFired = useRef(false);

  useEffect(() => {
    if (missionFired.current) return;
    missionFired.current = true;
    fetch('/api/missions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_type: 'listening_quiz' }),
    });
  }, []);

  return (
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-bold font-display text-ikori-dark mb-6">{t('session_complete')}</h1>
      <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-6 text-center mb-6">
        <div className="bg-ikori-gradient-subtle rounded-ikori p-6">
          <p className="text-4xl font-bold text-ikori-500">{pct}%</p>
          <p className="text-ikori-muted mt-2 font-sans">
            {correct} / {total} {t('correct')}
          </p>
        </div>
      </div>
      <button
        onClick={onPracticeAgain}
        className="btn-green w-full py-3 rounded-ikori-sm font-semibold font-sans"
      >
        {t('practice_again')}
      </button>
      <button
        onClick={() => window.location.href = "/dashboard"}
        className="btn-secondary w-full mt-3"
      >
        {t('back_dashboard')}
      </button>
    </div>
  );
}
