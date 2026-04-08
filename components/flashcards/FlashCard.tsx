"use client";

import { useState } from "react";
import type { Vocabulary } from "@/types";
import { Volume2 } from "lucide-react";

type CardMode = "classic" | "reverse" | "context";

interface FlashCardProps {
  word: Vocabulary;
  mode: CardMode;
}

export default function FlashCard({ word, mode }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  function getFront() {
    switch (mode) {
      case "classic":
        return (
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">{word.word}</p>
            <p className="text-xl text-gray-400">{word.kana}</p>
          </div>
        );
      case "reverse":
        return (
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{word.meaning_bn}</p>
            <p className="text-lg text-gray-400 mt-1">{word.meaning_en}</p>
          </div>
        );
      case "context":
        return (
          <div className="text-center">
            <p className="text-xl text-white leading-relaxed">
              {word.example_sentence_jp.replace(word.word, "______")}
            </p>
            <p className="text-sm text-gray-500 mt-3">What word fills the blank?</p>
          </div>
        );
    }
  }

  function getBack() {
    switch (mode) {
      case "classic":
        return (
          <div className="text-center space-y-3">
            <p className="text-xl font-bold text-accent-orange">{word.meaning_bn}</p>
            <p className="text-lg text-gray-300">{word.meaning_en}</p>
            <p className="text-sm text-gray-500 italic">{word.example_sentence_jp}</p>
            {word.example_sentence_bn && (
              <p className="text-sm text-gray-600">{word.example_sentence_bn}</p>
            )}
          </div>
        );
      case "reverse":
        return (
          <div className="text-center space-y-3">
            <p className="text-3xl font-bold text-white">{word.word}</p>
            <p className="text-xl text-gray-400">{word.kana}</p>
            <p className="text-sm text-gray-500 italic">{word.example_sentence_jp}</p>
          </div>
        );
      case "context":
        return (
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold text-accent-orange">{word.word}</p>
            <p className="text-lg text-gray-400">{word.kana}</p>
            <p className="text-sm text-gray-300">{word.meaning_bn}</p>
            <p className="text-sm text-gray-500 italic">{word.example_sentence_jp}</p>
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
          className="bg-navy-light rounded-2xl p-8 min-h-[250px] flex flex-col items-center justify-center border border-navy-lighter"
          style={{ backfaceVisibility: "hidden" }}
        >
          {getFront()}
          <p className="text-xs text-gray-600 mt-6">Tap to flip</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-navy-light rounded-2xl p-8 min-h-[250px] flex flex-col items-center justify-center border border-accent-orange/30"
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
              }}
              className="mt-4 text-accent-orange hover:text-orange-400"
            >
              <Volume2 size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
