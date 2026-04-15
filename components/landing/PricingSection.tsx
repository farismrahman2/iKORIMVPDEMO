"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

interface PricingSectionProps {
  monthlyPrice: string;
  examPrepPrice: string;
}

const FREE_FEATURES = [
  { text: "3 vocab sessions / week", included: true },
  { text: "1 grammar session / week", included: true },
  { text: "1 listening session / week", included: true },
  { text: "1 mock exam (ever)", included: true },
  { text: "Readiness tracking", included: true },
  { text: "Unlimited mocks", included: false },
  { text: "Full study plan", included: false },
  { text: "Streak freeze", included: false },
];

const PAID_FEATURES = [
  { text: "Unlimited vocab sessions" },
  { text: "Unlimited grammar sessions" },
  { text: "Unlimited listening sessions" },
  { text: "Unlimited mock exams" },
  { text: "Full readiness tracking" },
  { text: "Personalized study plan" },
  { text: "1 streak freeze / month" },
  { text: "Priority support" },
];

export default function PricingSection({ monthlyPrice, examPrepPrice }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-ikori-surface">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-ikori-dark mb-4">
            Simple pricing
          </h2>
          <p className="text-ikori-muted text-lg">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="card space-y-6">
            <div>
              <h3 className="text-xl font-display font-bold text-ikori-dark">Free</h3>
              <p className="text-ikori-muted text-sm mt-1">Get started at no cost</p>
            </div>
            <div>
              <span className="text-4xl font-display font-bold text-ikori-dark">৳0</span>
              <span className="text-ikori-muted text-sm ml-1">forever</span>
            </div>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {f.included ? (
                    <Check size={16} className="text-ikori-500 shrink-0" />
                  ) : (
                    <X size={16} className="text-ikori-muted shrink-0" />
                  )}
                  <span className={f.included ? "text-ikori-body" : "text-ikori-muted"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn-secondary w-full text-center block">
              Start Free
            </Link>
          </div>

          {/* Paid Tier */}
          <div className="relative card border-2 border-ikori-500 space-y-6">
            <div className="absolute -top-3 left-4 bg-ikori-500 text-white text-xs font-bold px-3 py-1 rounded-ikori-full">
              MOST POPULAR
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-ikori-dark">Full Access</h3>
              <p className="text-ikori-muted text-sm mt-1">Everything unlimited</p>
            </div>
            <div>
              <span className="text-4xl font-display font-bold text-ikori-dark">৳{monthlyPrice}</span>
              <span className="text-ikori-muted text-sm ml-1">/month</span>
              <div className="mt-1">
                <span className="text-sm text-ikori-500 font-medium">
                  or ৳{examPrepPrice} for 90 days
                </span>
              </div>
            </div>
            <ul className="space-y-3">
              {PAID_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-ikori-500 shrink-0" />
                  <span className="text-ikori-body">{f.text}</span>
                </li>
              ))}
            </ul>
            <Link href="/n5/checkout" className="btn-green w-full text-center block">
              Get Full Access
            </Link>
            <p className="text-xs text-ikori-muted text-center">
              7-day refund guarantee. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
