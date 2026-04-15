"use client";

import { X, Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  remaining?: number;
  limit?: number;
}

export default function UpgradePrompt({ isOpen, onClose, module, limit }: UpgradePromptProps) {
  const router = useRouter();
  const [bypassing, setBypassing] = useState(false);

  if (!isOpen) return null;

  const moduleName = module.replace(/_/g, " ");

  async function handleBypass() {
    setBypassing(true);
    try {
      const res = await fetch("/api/subscription/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      if (res.ok) {
        onClose();
        window.location.reload();
      }
    } catch {
      // Silently fail
    }
    setBypassing(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-ikori p-6 space-y-5 animate-slide-up mx-4 sm:mx-auto mb-0 sm:mb-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-ikori-500" />
            <h2 className="text-lg font-display font-bold text-ikori-dark">Upgrade to continue</h2>
          </div>
          <button onClick={onClose} className="text-ikori-muted hover:text-ikori-dark p-1">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ikori-body">
          You&apos;ve used all your free <strong>{moduleName}</strong> sessions this week
          {limit ? ` (${limit} per week)` : ""}.
          Upgrade for unlimited access.
        </p>

        {/* What you get */}
        <div className="bg-ikori-surface rounded-ikori-sm p-4 space-y-2">
          <p className="text-xs font-semibold text-ikori-muted uppercase tracking-wide">Full Access includes</p>
          {["Unlimited sessions in all modules", "Full mock exams anytime", "Personalized study plan", "Streak freeze (1/month)"].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-ikori-body">
              <Check size={14} className="text-ikori-500 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/n5/checkout?plan=monthly")}
            className="card text-center hover:border-ikori-500 transition-colors"
          >
            <p className="text-2xl font-display font-bold text-ikori-dark">৳499</p>
            <p className="text-xs text-ikori-muted">/month</p>
          </button>
          <button
            onClick={() => router.push("/n5/checkout?plan=exam_prep")}
            className="card text-center hover:border-ikori-500 transition-colors"
          >
            <p className="text-2xl font-display font-bold text-ikori-dark">৳999</p>
            <p className="text-xs text-ikori-muted">90 days</p>
          </button>
        </div>

        {/* Prototype bypass */}
        <div className="border-t border-ikori-border pt-4 space-y-3">
          <button
            onClick={handleBypass}
            disabled={bypassing}
            className="btn-green w-full flex items-center justify-center gap-2"
          >
            <span className="text-xs">🧪</span>
            {bypassing ? "Activating..." : "Prototype: Bypass — Activate Paid"}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Remind me later
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
