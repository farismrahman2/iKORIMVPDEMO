"use client";

import { ClipboardCheck, Target, Award } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Diagnose your level",
    description: "Take a quick 20-question diagnostic. Our engine identifies your exact weak areas across vocabulary, grammar, and listening.",
  },
  {
    icon: Target,
    title: "Train on your weak areas",
    description: "Get a personalized daily study plan with Bangla explanations. Flashcards, drills, and listening exercises adapt to you.",
  },
  {
    icon: Award,
    title: "Pass the exam",
    description: "Track your readiness score. When you hit \"Probable Pass\" or above, you're ready. Take a full mock to confirm.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-ikori-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-ikori-dark mb-4">
            How it works
          </h2>
          <p className="text-ikori-muted text-lg max-w-md mx-auto">
            From zero to N5 in three simple steps
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-ikori-full bg-ikori-gradient flex items-center justify-center">
                  <Icon size={28} className="text-ikori-800" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-bold text-ikori-500 uppercase tracking-wider mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-display font-bold text-ikori-dark mb-3">
                  {step.title}
                </h3>
                <p className="text-ikori-body text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
