"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, Send, MessageCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { SupportTicket } from "@/types";

const FAQ_ITEMS = [
  { q: "Is this for absolute beginners?", a: "Yes! iKORI starts with a diagnostic to find your level. It adapts to where you are." },
  { q: "How is this different from YouTube?", a: "iKORI diagnoses your weak areas, creates a personalized plan, and tracks readiness. Generic resources can't do this." },
  { q: "Can I use this on my phone?", a: "Yes — iKORI is mobile-first. Add it to your home screen for an app-like experience." },
  { q: "What's the refund policy?", a: "7-day full refund, no questions asked. Contact us from this page." },
  { q: "Do I need hiragana first?", a: "It helps, but our vocab module includes kana recognition practice too." },
];

const CATEGORIES = [
  "Bug report",
  "Content issue",
  "Payment",
  "Feature request",
  "Other",
];

export default function SupportPage() {
  useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support/ticket");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });
      if (res.ok) {
        setSubmitted(true);
        setCategory("");
        setMessage("");
        loadTickets();
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch {
      // Silently fail
    }
    setSubmitting(false);
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-ikori-dark">Help & Support</h1>

      {/* FAQ */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">FAQ</h2>
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="card cursor-pointer"
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-ikori-dark">{item.q}</h3>
              <ChevronDown
                size={16}
                className={`text-ikori-muted shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
              />
            </div>
            {openFaq === i && (
              <p className="text-sm text-ikori-body mt-3 pt-3 border-t border-ikori-border leading-relaxed">
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-ikori-500" />
          <h2 className="text-base font-display font-semibold text-ikori-dark">Contact Us</h2>
        </div>

        {submitted && (
          <div className="flex items-center gap-2 text-sm text-ikori-500 bg-ikori-50 border border-ikori-200 rounded-ikori-sm p-3">
            <CheckCircle size={16} />
            Ticket submitted! We&apos;ll respond within 24 hours.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            required
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue..."
            className="input min-h-[120px] resize-y"
            required
          />
          <button
            type="submit"
            disabled={submitting || !category || !message}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} />
            {submitting ? "Sending..." : "Submit Ticket"}
          </button>
        </form>
      </div>

      {/* Past Tickets */}
      {tickets.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ikori-muted uppercase tracking-wide">Your Tickets</h2>
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-ikori-body">{ticket.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-ikori-full border ${
                  ticket.status === "resolved"
                    ? "bg-ikori-50 text-ikori-700 border-ikori-200"
                    : ticket.status === "in_progress"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-sm text-ikori-body line-clamp-2">{ticket.message}</p>
              {ticket.admin_reply && (
                <div className="mt-2 pt-2 border-t border-ikori-border">
                  <p className="text-xs text-ikori-muted">Admin reply:</p>
                  <p className="text-sm text-ikori-dark">{ticket.admin_reply}</p>
                </div>
              )}
              <p className="text-xs text-ikori-muted mt-2">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
