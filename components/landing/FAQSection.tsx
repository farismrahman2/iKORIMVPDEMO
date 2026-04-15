"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Is this for absolute beginners?",
    a: "Yes! iKORI starts with a diagnostic to find your level. Whether you know zero Japanese or have some basics, the system adapts to you.",
  },
  {
    q: "What if I fail the exam?",
    a: "Our readiness tracker tells you when you're ready. If you reach \"Probable Pass\" band before taking the real JLPT, your chances are excellent. We recommend waiting until you're in that range.",
  },
  {
    q: "How is this different from YouTube or Duolingo?",
    a: "iKORI is specifically built for JLPT N5 with Bangla explanations. It diagnoses your weak areas, creates a personalized study plan, and tracks your readiness. Generic apps don't do this.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes — iKORI is designed mobile-first. It works perfectly on any phone browser. You can even add it to your home screen as an app.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept bkash and SSL Commerz. For the prototype period, you can activate full access for free with the bypass button.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — 7-day full refund, no questions asked. If you're not satisfied within 7 days of payment, we'll refund you completely.",
  },
  {
    q: "Do I need to know hiragana first?",
    a: "It helps, but it's not required. Our vocabulary module includes kana recognition practice. We recommend learning hiragana alongside your N5 prep.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-ikori-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-ikori-dark mb-4">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="card cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-ikori-dark">{item.q}</h3>
                <ChevronDown
                  size={18}
                  className={`text-ikori-muted shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </div>
              {open === i && (
                <p className="text-sm text-ikori-body mt-3 pt-3 border-t border-ikori-border leading-relaxed">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
