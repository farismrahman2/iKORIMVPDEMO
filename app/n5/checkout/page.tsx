"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Shield } from "lucide-react";
import Link from "next/link";

const PLANS = {
  monthly: { name: "Monthly", price: 499, period: "/month", days: 30 },
  exam_prep: { name: "Exam Prep Pack", price: 999, period: "one-time", days: 90 },
};

const FEATURES = [
  "Unlimited vocab, grammar & listening sessions",
  "Unlimited mock exams",
  "Personalized study plan based on your weak areas",
  "Full readiness band tracking",
  "1 streak freeze per month",
  "Priority support",
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "exam_prep">(
    (searchParams.get("plan") as "monthly" | "exam_prep") || "monthly"
  );
  const [bypassing, setBypassing] = useState(false);
  const [success, setSuccess] = useState(false);

  const plan = PLANS[selectedPlan];

  async function handleBypass() {
    setBypassing(true);
    try {
      const res = await fetch("/api/subscription/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch {
      // Silently fail
    }
    setBypassing(false);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-ikori-full bg-ikori-50 flex items-center justify-center">
          <Check size={32} className="text-ikori-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-ikori-dark mb-2">Welcome to Full Access!</h1>
        <p className="text-ikori-muted text-sm">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <Link href="/" className="text-lg font-display font-bold text-ikori-dark">
          iKORI <span className="text-ikori-500">N5</span>
        </Link>
        <h1 className="text-2xl font-display font-bold text-ikori-dark mt-4">
          Get Full Access
        </h1>
        <p className="text-sm text-ikori-muted mt-2">
          Unlimited everything. Cancel anytime. 7-day refund guarantee.
        </p>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(
          ([key, p]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`card text-center transition-all ${
                selectedPlan === key
                  ? "border-2 border-ikori-500 bg-ikori-50"
                  : "hover:border-ikori-300"
              }`}
            >
              <p className="text-2xl font-display font-bold text-ikori-dark">৳{p.price}</p>
              <p className="text-xs text-ikori-muted">{p.period}</p>
              <p className="text-xs text-ikori-500 font-medium mt-1">{p.days} days</p>
            </button>
          )
        )}
      </div>

      {/* Features */}
      <div className="card space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">
          What you get
        </h3>
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-ikori-body">
            <Check size={14} className="text-ikori-500 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      {/* Payment section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-ikori-500" />
          <span className="text-sm font-semibold text-ikori-dark">Secure Payment</span>
        </div>
        <p className="text-xs text-ikori-muted mb-4">
          bkash and SSL Commerz integration coming soon.
        </p>

        {/* Prototype bypass */}
        <div className="bg-amber-50 border border-amber-200 rounded-ikori-sm p-4 text-center">
          <p className="text-xs text-amber-700 font-medium mb-3">
            🧪 Prototype Mode — No real payment required
          </p>
          <button
            onClick={handleBypass}
            disabled={bypassing}
            className="btn-green w-full"
          >
            {bypassing ? "Activating..." : `Bypass Payment — Activate ${plan.name}`}
          </button>
        </div>
      </div>

      <p className="text-xs text-ikori-muted text-center">
        7-day full refund if you&apos;re not satisfied. Cancel anytime from Settings.
      </p>

      <div className="mt-6 text-center">
        <Link href="/signup" className="text-sm text-ikori-500 hover:underline">
          Don&apos;t have an account? Sign up first
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="border-2 border-ikori-200 border-t-ikori-500 rounded-full w-8 h-8 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
