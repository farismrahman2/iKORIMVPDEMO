"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import type { Vocabulary } from "@/types";
import { Volume2, CheckCircle, XCircle } from "lucide-react";

type VocabMode = "recognition" | "recall" | "reading" | "usage";

const CATEGORIES = [
  "all",
  "greetings",
  "numbers",
  "time",
  "family",
  "food",
  "verbs",
  "adjectives",
  "body",
  "nature",
  "daily_life",
];

export default function VocabPage() {
  const { t, lang } = useLanguage();

  const MODES: { key: VocabMode; label: string; desc: string }[] = [
    { key: "recognition", label: t('recognition'), desc: t('jp_to_en') },
    { key: "recall", label: t('recall'), desc: t('en_to_jp') },
    { key: "reading", label: t('reading'), desc: t('kanji_to_kana') },
    { key: "usage", label: t('usage'), desc: t('context') },
  ];

  const [mode, setMode] = useState<VocabMode>("recognition");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState(0);
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  const loadWords = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("vocabulary").select("*").eq("validated", true);

    if (category !== "all") {
      query = query.eq("category", category);
    }
    if (difficulty > 0) {
      query = query.eq("difficulty", difficulty);
    }

    const { data } = await query.limit(50);
    if (data && data.length > 0) {
      const shuffled = [...(data as Vocabulary[])].sort(() => Math.random() - 0.5);
      setWords(shuffled);
      setCurrentIdx(0);
      setCorrect(0);
      setTotal(0);
      setSessionDone(false);
      generateOptions(shuffled, 0, mode, shuffled);
    }
    setLoading(false);
  }, [supabase, category, difficulty, mode]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  function generateOptions(
    allWords: Vocabulary[],
    idx: number,
    currentMode: VocabMode,
    pool: Vocabulary[]
  ) {
    const word = allWords[idx];
    if (!word) return;

    const distractors = pool
      .filter((w) => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    let correctOption: string;
    let distractorOptions: string[];

    switch (currentMode) {
      case "recognition":
        correctOption = lang === 'bn' ? word.meaning_bn : word.meaning_en;
        distractorOptions = distractors.map((d) => lang === 'bn' ? d.meaning_bn : d.meaning_en);
        break;
      case "recall":
        correctOption = `${word.word} (${word.kana})`;
        distractorOptions = distractors.map((d) => `${d.word} (${d.kana})`);
        break;
      case "reading":
        correctOption = word.kana;
        distractorOptions = distractors.map((d) => d.kana);
        break;
      case "usage":
        correctOption = word.word;
        distractorOptions = distractors.map((d) => d.word);
        break;
    }

    // Pad with fallback options if we don't have enough distractors
    const fallbacks = ["---", "--", "-"];
    while (distractorOptions.length < 3) {
      distractorOptions.push(fallbacks[distractorOptions.length] || "---");
    }

    const allOptions = [correctOption, ...distractorOptions];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    setOptions(shuffledOptions);
    setCorrectIdx(shuffledOptions.indexOf(correctOption));
    setSelected(null);
    setShowResult(false);
  }

  function handleSelect(idx: number) {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    setTotal((t) => t + 1);
    if (idx === correctIdx) {
      setCorrect((c) => c + 1);
    }
  }

  function nextQuestion() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= words.length || nextIdx >= 20) {
      setSessionDone(true);
      return;
    }
    setCurrentIdx(nextIdx);
    generateOptions(words, nextIdx, mode, words);
  }

  function getQuestionText() {
    const word = words[currentIdx];
    if (!word) return "";

    switch (mode) {
      case "recognition":
        return `${word.word} (${word.kana})`;
      case "recall":
        return lang === 'bn' ? word.meaning_bn : word.meaning_en;
      case "reading":
        return word.kanji || word.word;
      case "usage":
        return word.example_sentence_jp.replace(word.word, "______");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ikori-white">
        <div className="animate-pulse text-ikori-muted font-sans">Loading vocabulary...</div>
      </div>
    );
  }

  if (sessionDone) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <VocabSessionComplete pct={pct} correct={correct} total={total} onPracticeAgain={loadWords} t={t} />
    );
  }

  const word = words[currentIdx];

  return (
    <div className="px-4 py-6 bg-ikori-white min-h-screen">
      <h1 className="text-2xl font-bold font-display text-ikori-dark mb-4">{t('vocabulary')}</h1>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              if (words.length > 0) {
                generateOptions(words, currentIdx, m.key, words);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors font-sans ${
              mode === m.key
                ? "bg-ikori-500 text-white"
                : "bg-ikori-50 text-ikori-body hover:text-ikori-dark"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input flex-1"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? t('all_categories') : c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="input"
        >
          <option value={0}>{t('all_levels')}</option>
          <option value={1}>{t('easy_level')}</option>
          <option value={2}>{t('medium_level')}</option>
          <option value={3}>{t('hard_level')}</option>
        </select>
      </div>

      {/* Progress */}
      <div className="flex justify-between text-sm text-ikori-muted mb-4 font-sans">
        <span>
          Question {currentIdx + 1} / {Math.min(words.length, 20)}
        </span>
        <span>
          {correct} / {total} {t('correct')}
        </span>
      </div>

      {/* Question */}
      {word && (
        <div className="mb-6">
          <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-6 text-center mb-6">
            <p className="text-2xl font-bold text-ikori-dark font-display" style={{ fontSize: "1.5rem" }}>
              {getQuestionText()}
            </p>
            {mode === "usage" && (
              <p className="text-sm text-ikori-muted mt-2 font-sans">
                {t('fill_blank')}
              </p>
            )}
            {word.audio_url && (
              <button
                onClick={() => {
                  const audio = new Audio(word.audio_url!);
                  audio.play().catch(() => {});
                }}
                className="mt-3 text-ikori-500 hover:text-ikori-400"
              >
                <Volume2 size={20} />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option, idx) => {
              let className =
                "w-full text-left p-4 rounded-ikori-sm border text-sm active:scale-[0.98] transition-all flex items-center gap-3 ";

              if (showResult) {
                if (idx === correctIdx) {
                  className += "border-green-300 bg-green-50 text-green-800";
                } else if (idx === selected && idx !== correctIdx) {
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
                  <span className="font-medium text-ikori-muted w-6 font-sans">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-sans" style={{ fontSize: "1.1rem" }}>{option}</span>
                  {showResult && idx === correctIdx && (
                    <CheckCircle size={18} className="ml-auto text-green-600" />
                  )}
                  {showResult && idx === selected && idx !== correctIdx && (
                    <XCircle size={18} className="ml-auto text-red-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation after answer */}
          {showResult && (
            <div className="mt-4 space-y-3">
              <div className="bg-white rounded-ikori border border-ikori-border shadow-ikori-sm p-4">
                <p className="text-sm text-ikori-body font-sans">
                  <span className="font-semibold text-ikori-dark">{word.word}</span>{" "}
                  ({word.kana}) — {lang === 'bn' ? word.meaning_bn : word.meaning_en}
                </p>
                <p className="text-sm text-ikori-muted mt-1 font-sans">{lang === 'bn' ? word.meaning_en : word.meaning_bn}</p>
                {word.example_sentence_jp && (
                  <p className="text-sm text-ikori-body mt-2 italic font-sans">
                    {word.example_sentence_jp}
                  </p>
                )}
              </div>

              <button
                onClick={nextQuestion}
                className="btn-primary w-full py-3 rounded-ikori-sm font-semibold font-sans"
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>
      )}

      {words.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ikori-muted font-sans">{t('no_vocab')}</p>
        </div>
      )}
    </div>
  );
}

function VocabSessionComplete({
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
      body: JSON.stringify({ mission_type: 'vocab_drill' }),
    });
    // Also mark grammar_drill since grammar practice uses vocab page
    fetch('/api/missions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_type: 'grammar_drill' }),
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
