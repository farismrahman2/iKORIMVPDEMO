"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface HeroSectionProps {
  headline: string;
  subhead: string;
  ctaText: string;
  passStat: string;
}

export default function HeroSection({ headline, subhead, ctaText, passStat }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-ikori-gradient-dark">
      {/* Animated dots */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
            style={{
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-ikori-full mb-8">
          <Sparkles size={14} className="text-ikori-300" />
          <span className="text-sm text-ikori-200 font-medium">JLPT N5 Pass Engine</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
          {headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-ikori-200 max-w-lg mx-auto mb-10 leading-relaxed">
          {subhead}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/n5/trial"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-ikori-dark font-display font-bold text-lg rounded-ikori-full active:scale-[0.97] transition-all hover:bg-ikori-50"
          >
            {ctaText}
            <ArrowRight size={20} />
          </Link>
          <Link
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-medium text-lg rounded-ikori-full border border-white/30 active:scale-[0.97] transition-all hover:bg-white/10"
          >
            See pricing
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-ikori-300 text-sm font-medium">{passStat}</p>
        </div>
      </div>
    </section>
  );
}
