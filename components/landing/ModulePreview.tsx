"use client";

import { BookOpen, PenLine, Headphones, Layers } from "lucide-react";

const MODULES = [
  {
    icon: Layers,
    title: "Smart Flashcards",
    description: "SRS-powered cards with Bangla meanings. The more you practice, the smarter the spacing gets.",
    color: "bg-ikori-50 text-ikori-700",
    preview: "食べる → খাওয়া",
  },
  {
    icon: PenLine,
    title: "Grammar Questions",
    description: "Particle, verb form, and sentence completion drills with detailed Bangla explanations.",
    color: "bg-blue-50 text-blue-700",
    preview: "わたし＿＿がくせいです → は",
  },
  {
    icon: Headphones,
    title: "Listening Module",
    description: "Audio clips with transcript unlock and speed control. 5 practice modes including dialogue.",
    color: "bg-ikori-cyan-50 text-ikori-cyan-500",
    preview: "🎧 はじめまして...",
  },
  {
    icon: BookOpen,
    title: "Readiness Tracker",
    description: "Your readiness band updates after every session. Know exactly when you're ready to pass.",
    color: "bg-amber-50 text-amber-700",
    preview: "72% → Probable Pass",
  },
];

export default function ModulePreview() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-ikori-surface">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-ikori-dark mb-4">
            Everything you need to pass N5
          </h2>
          <p className="text-ikori-muted text-lg">
            4 modules, all with Bangla support
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] sm:w-auto snap-center card space-y-3"
              >
                <div className={`w-10 h-10 rounded-ikori-sm flex items-center justify-center ${mod.color}`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-display font-bold text-ikori-dark">{mod.title}</h3>
                <p className="text-sm text-ikori-body leading-relaxed">{mod.description}</p>
                <div className="pt-2 border-t border-ikori-border">
                  <p className="text-sm font-mono text-ikori-500">{mod.preview}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
