"use client";

import type { AdminStats } from "@/types";
import { BookOpen, FileText, Users, Headphones } from "lucide-react";

interface StatsCardsProps {
  stats: AdminStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Questions",
      value: stats.total_questions,
      sub: `${stats.validated_questions} validated`,
      icon: FileText,
      color: "text-accent-orange",
    },
    {
      label: "Vocabulary",
      value: stats.total_vocab,
      sub: `${stats.validated_vocab} validated`,
      icon: BookOpen,
      color: "text-band-probable",
    },
    {
      label: "With Audio",
      value: stats.questions_with_audio,
      sub: `of ${stats.total_questions} questions`,
      icon: Headphones,
      color: "text-band-strong",
    },
    {
      label: "Users",
      value: stats.total_users,
      sub: "registered",
      icon: Users,
      color: "text-accent-gold",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-navy-light rounded-xl p-4 border border-navy-lighter"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={card.color} />
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
