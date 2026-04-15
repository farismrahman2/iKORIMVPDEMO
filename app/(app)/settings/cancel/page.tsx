"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const REASONS = [
  "Too expensive",
  "Not using it enough",
  "Found an alternative",
  "Passed the exam already",
  "Other",
];

export default function CancelPage() {
  const router = useRouter();
  const [step, setStep] = useState<"reason" | "offer" | "confirm">("reason");
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        router.push("/settings");
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setCancelling(false);
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-ikori-muted hover:text-ikori-dark"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {step === "reason" && (
        <>
          <h1 className="text-2xl font-display font-bold text-ikori-dark">Cancel Subscription</h1>
          <p className="text-sm text-ikori-body">We&apos;re sorry to see you go. Can you tell us why?</p>

          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`card w-full text-left text-sm transition-all ${
                  reason === r
                    ? "border-2 border-ikori-500 bg-ikori-50 font-medium text-ikori-dark"
                    : "text-ikori-body hover:border-ikori-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("offer")}
            disabled={!reason}
            className="btn-danger w-full disabled:opacity-50"
          >
            Continue
          </button>
        </>
      )}

      {step === "offer" && (
        <>
          <div className="card-gradient space-y-3 text-center">
            <h2 className="text-xl font-display font-bold text-ikori-900">Wait!</h2>
            <p className="text-sm text-ikori-800">
              How about <strong>one more month at 50% off</strong>?
              That&apos;s just ৳250 for full access.
            </p>
            <span className="badge">🧪 Prototype: offer tracking only</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Prototype: just accept and redirect
                router.push("/settings");
              }}
              className="btn-green w-full"
            >
              Accept 50% Off
            </button>
            <button
              onClick={() => setStep("confirm")}
              className="btn-secondary w-full"
            >
              No thanks, cancel anyway
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <div className="card border-red-200 bg-red-50 space-y-3 text-center">
            <AlertTriangle size={32} className="text-red-500 mx-auto" />
            <h2 className="text-lg font-display font-bold text-red-800">Confirm Cancellation</h2>
            <p className="text-sm text-red-700">
              Your subscription will be cancelled immediately. You&apos;ll be downgraded to the free plan.
              Your progress data will be preserved.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-danger w-full disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel My Subscription"}
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="btn-secondary w-full"
            >
              Keep My Subscription
            </button>
          </div>
        </>
      )}
    </div>
  );
}
