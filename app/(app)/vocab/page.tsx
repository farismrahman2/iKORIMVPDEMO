"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Vocabulary } from "@/types";
import { Volume2, CheckCircle, XCircle } from "lucide-react";

type VocabMode = "recognition" | "recall" | "reading" | "usage";

const MODES: { key: VocabMode; label: string; desc: string }[] = [
  { key: "recognition", label: "Recognition", desc: "JP \u2192 BN" },
  { key: "recall", label: "Recall", desc: "BN \u2192 JP" },
  { key: "reading", label: "Reading", desc: "Kanji \u2192 Kana" },
  { key: "usage", label: "Usage", desc: "Context" },
];

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
        correctOption = word.meaning_bn;
        distractorOptions = distractors.map((d) => d.meaning_bn);
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
        return word.meaning_bn;
      case "reading":
        return word.kanji || word.word;
      case "usage":
        return word.example_sentence_jp.replace(word.word, "______");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading vocabulary...</div>
      </div>
    );
  }

  if (sessionDone) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Session Complete</h1>
        <div className="bg-navy-light rounded-xl p-6 text-center mb-6">
          <p className="text-4xl font-bold text-accent-orange">{pct}%</p>
          <p className="text-gray-400 mt-2">
            {correct} / {total} correct
          </p>
        </div>
        <button
          onClick={loadWords}
          className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold"
        >
          Practice Again
        </button>
      </div>
    );
  }

  const word = words[currentIdx];

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Vocabulary</h1>

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
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              mode === m.key
                ? "bg-accent-orange text-white"
                : "bg-navy-light text-gray-400 hover:text-white"
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
          className="flex-1 px-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm"
        >
          <option value={0}>All Levels</option>
          <option value={1}>Easy</option>
          <option value={2}>Medium</option>
          <option value={3}>Hard</option>
        </select>
      </div>

      {/* Progress */}
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>
          Question {currentIdx + 1} / {Math.min(words.length, 20)}
        </span>
        <span>
          {correct} / {total} correct
        </span>
      </div>

      {/* Question */}
      {word && (
        <div className="mb-6">
          <div className="bg-navy-light rounded-xl p-6 text-center mb-6">
            <p className="text-2xl font-bold text-white" style={{ fontSize: "1.5rem" }}>
              {getQuestionText()}
            </p>
            {mode === "usage" && (
              <p className="text-sm text-gray-500 mt-2">
                Fill in the blank
              </p>
            )}
            {word.audio_url && (
              <button
                onClick={() => {
                  const audio = new Audio(word.audio_url!);
                  audio.play().catch(() => {});
                }}
                className="mt-3 text-accent-orange hover:text-orange-400"
              >
                <Volume2 size={20} />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option, idx) => {
              let className =
                "w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ";

              if (showResult) {
                if (idx === correctIdx) {
                  className += "border-green-500 bg-green-500/10 text-green-400";
                } else if (idx === selected && idx !== correctIdx) {
                  className += "border-red-500 bg-red-500/10 text-red-400";
                } else {
                  className += "border-navy-lighter bg-navy-light text-gray-500";
                }
              } else {
                className +=
                  "border-navy-lighter bg-navy-light text-gray-300 hover:border-gray-500";
              }

              return (
                <button key={idx} onClick={() => handleSelect(idx)} className={className}>
                  <span className="font-medium text-gray-500 w-6">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ fontSize: "1.1rem" }}>{option}</span>
                  {showResult && idx === correctIdx && (
                    <CheckCircle size={18} className="ml-auto text-green-400" />
                  )}
                  {showResult && idx === selected && idx !== correctIdx && (
                    <XCircle size={18} className="ml-auto text-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation after answer */}
          {showResult && (
            <div className="mt-4 space-y-3">
              <div className="bg-navy-light rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">{word.word}</span>{" "}
                  ({word.kana}) — {word.meaning_en}
                </p>
                <p className="text-sm text-gray-500 mt-1">{word.meaning_bn}</p>
                {word.example_sentence_jp && (
                  <p className="text-sm text-gray-400 mt-2 italic">
                    {word.example_sentence_jp}
                  </p>
                )}
              </div>

              <button
                onClick={nextQuestion}
                className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {words.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No vocabulary items found for this filter.</p>
        </div>
      )}
    </div>
  );
}
