"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import type { Vocabulary } from "@/types";
import { Volume2 } from "lucide-react";

type CardMode = "classic" | "reverse" | "context";

interface FlashCardProps {
  word: Vocabulary;
  mode: CardMode;
}

export default function FlashCard({ word, mode }: FlashCardProps) {
  const { t, lang } = useLanguage();
  const [flipped, setFlipped] = useState(false);

  function getFront() {
    switch (mode) {
      case "classic":
        return (
          <div className="text-center">
            <p className="text-3xl font-bold text-ikori-dark mb-2">{word.word}</p>
            <p className="text-xl text-ikori-muted">{word.kana}</p>
          </div>
        );
      case "reverse":
        return (
          <div className="text-center">
            <p className="text-2xl font-bold text-ikori-dark">{lang === 'bn' ? word.meaning_bn : word.meaning_en}</p>
            <p className="text-lg text-ikori-muted mt-1">{lang === 'bn' ? word.meaning_en : word.meaning_bn}</p>
          </div>
        );
      case "context":
        return (
          <div className="text-center">
            <p className="text-xl text-ikori-dark leading-relaxed">
              {word.example_sentence_jp.replace(word.word, "______")}
            </p>
            <p className="text-sm text-ikori-muted mt-3">{t('fill_blank')}</p>
          </div>
        );
    }
  }

  function getBack() {
    switch (mode) {
      case "classic":
        return (
          <div className="text-center space-y-3">
            <p className="text-xl font-bold text-ikori-700">{lang === 'bn' ? word.meaning_bn : word.meaning_en}</p>
            <p className="text-lg text-ikori-body">{lang === 'bn' ? word.meaning_en : word.meaning_bn}</p>
            <p className="text-sm text-ikori-muted italic">{word.example_sentence_jp}</p>
            {word.example_sentence_bn && (
              <p className="text-sm text-ikori-muted">{word.example_sentence_bn}</p>
            )}
          </div>
        );
      case "reverse":
        return (
          <div className="text-center space-y-3">
            <p className="text-3xl font-bold text-ikori-dark">{word.word}</p>
            <p className="text-xl text-ikori-muted">{word.kana}</p>
            <p className="text-sm text-ikori-muted italic">{word.example_sentence_jp}</p>
          </div>
        );
      case "context":
        return (
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold text-ikori-700">{word.word}</p>
            <p className="text-lg text-ikori-muted">{word.kana}</p>
            <p className="text-sm text-ikori-body">{lang === 'bn' ? word.meaning_bn : word.meaning_en}</p>
            <p className="text-sm text-ikori-muted italic">{word.example_sentence_jp}</p>
          </div>
        );
    }
  }

  return (
    <div
      className="perspective-1000 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="bg-white rounded-ikori border border-ikori-border shadow-ikori p-8 min-h-[280px] flex flex-col items-center justify-center"
          style={{ backfaceVisibility: "hidden" }}
        >
          {getFront()}
          <p className="text-xs text-ikori-muted mt-6">{t('tap_to_flip')}</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-ikori-gradient-subtle rounded-ikori border border-ikori-200 p-8 min-h-[280px] flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {getBack()}
          {word.audio_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const audio = new Audio(word.audio_url!);
                audio.play().catch(() => {});
              }}
              className="mt-4 text-ikori-500 hover:text-ikori-400"
            >
              <Volume2 size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
