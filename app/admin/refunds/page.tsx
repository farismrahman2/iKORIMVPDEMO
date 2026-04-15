"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard } from "lucide-react";
import type { Subscription } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-ikori-50 text-ikori-700 border-ikori-200",
  expired: "bg-gray-50 text-gray-700 border-gray-200",
  cancelled: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminRefundsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/refunds");
      const data = await res.json();
      if (data.subscriptions) setSubscriptions(data.subscriptions);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleRefund(id: string) {
    if (!confirm("Process refund? This will downgrade the user to free tier.")) return;
    setRefunding(id);
    try {
      await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: id }),
      });
      loadData();
    } catch {
      // Silently fail
    }
    setRefunding(null);
  }

  if (loading) {
    return <div className="p-8 text-center text-ikori-muted animate-pulse">Loading subscriptions...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-ikori-dark">Refund Management</h1>
        <span className="badge">🧪 Prototype</span>
      </div>

      <div className="bg-white rounded-ikori border border-ikori-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ikori-muted text-left border-b border-ikori-border">
              <th className="p-3">User</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b border-ikori-border hover:bg-ikori-surface">
                <td className="p-3 text-ikori-dark font-mono text-xs">
                  {sub.user_id.slice(0, 8)}...
                </td>
                <td className="p-3 text-ikori-body">{sub.plan}</td>
                <td className="p-3 text-ikori-dark">
                  {sub.amount_bdt ? `৳${sub.amount_bdt}` : "—"}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-ikori-full border ${STATUS_COLORS[sub.status] || ""}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-3 text-ikori-muted text-xs">
                  {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">
                  {sub.status === "active" && sub.is_refundable && (
                    <button
                      onClick={() => handleRefund(sub.id)}
                      disabled={refunding === sub.id}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <CreditCard size={12} />
                      {refunding === sub.id ? "Processing..." : "Refund"}
                    </button>
                  )}
                  {sub.status === "refunded" && (
                    <span className="text-xs text-red-400">Refunded</span>
                  )}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ikori-muted">
                  No subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
