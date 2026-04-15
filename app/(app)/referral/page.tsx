"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function ReferralPage() {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCode() {
      try {
        const res = await fetch("/api/referral/link");
        const data = await res.json();
        if (data.code) setCode(data.code);
      } catch {
        // Silently fail
      }
      setLoading(false);
    }
    loadCode();
  }, []);

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : "";

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const message = encodeURIComponent(
      `I'm using iKORI to prepare for JLPT N5. It has Bangla explanations and tracks your readiness. Try it free: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-ikori-muted">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-ikori-dark">Refer a Friend</h1>

      <div className="card-gradient space-y-3">
        <h2 className="text-lg font-display font-bold text-ikori-900">Share iKORI N5</h2>
        <p className="text-sm text-ikori-800">
          Both you and your friend get a free week of Full Access when they sign up.
        </p>
        <span className="badge">🧪 Prototype: tracking only, no auto-reward</span>
      </div>

      {/* Referral link */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-ikori-dark">Your referral link</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="input text-xs font-mono flex-1"
          />
          <button
            onClick={copyLink}
            className="btn-secondary px-3 py-3 shrink-0"
          >
            {copied ? <CheckCircle size={18} className="text-ikori-500" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="space-y-3">
        <button onClick={shareWhatsApp} className="btn-green w-full flex items-center justify-center gap-2">
          <Share2 size={18} />
          Share on WhatsApp
        </button>
        <button onClick={copyLink} className="btn-secondary w-full flex items-center justify-center gap-2">
          <Copy size={18} />
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Referral code */}
      <div className="card">
        <p className="text-xs text-ikori-muted uppercase tracking-wide mb-2">Your Code</p>
        <p className="text-2xl font-mono font-bold text-ikori-dark tracking-wider">{code}</p>
      </div>
    </div>
  );
}
