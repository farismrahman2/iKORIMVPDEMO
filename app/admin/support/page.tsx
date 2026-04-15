"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import type { SupportTicket } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-ikori-50 text-ikori-700 border-ikori-200",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function updateTicket(id: string, status: string, adminReply?: string) {
    setSaving(true);
    try {
      await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, admin_reply: adminReply }),
      });
      loadTickets();
      setSelectedId(null);
      setReply("");
    } catch {
      // Silently fail
    }
    setSaving(false);
  }

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  if (loading) {
    return <div className="p-8 text-center text-ikori-muted animate-pulse">Loading tickets...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-ikori-dark">Support Tickets</h1>
        <span className="text-sm text-ikori-muted">{tickets.length} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {["all", "open", "in_progress", "resolved"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-ikori-sm text-sm transition-colors ${
              filter === f ? "bg-ikori-500 text-white" : "bg-white text-ikori-muted border border-ikori-border"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {filtered.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-ikori border border-ikori-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-ikori-muted" />
                <span className="text-xs font-medium text-ikori-body">{ticket.category}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-ikori-full border ${STATUS_COLORS[ticket.status] || ""}`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-ikori-dark mb-2">{ticket.message}</p>
            {ticket.admin_reply && (
              <div className="bg-ikori-surface rounded-ikori-sm p-3 mb-2">
                <p className="text-xs text-ikori-muted">Admin reply:</p>
                <p className="text-sm text-ikori-dark">{ticket.admin_reply}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-ikori-muted">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
              {selectedId === ticket.id ? (
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply..."
                    className="px-2 py-1 text-xs border border-ikori-border rounded-ikori-sm w-48"
                  />
                  <button
                    onClick={() => updateTicket(ticket.id, "resolved", reply)}
                    disabled={saving}
                    className="text-xs text-ikori-500 font-medium"
                  >
                    {saving ? "..." : "Send & Resolve"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedId(ticket.id)}
                  className="text-xs text-ikori-500 hover:underline"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-ikori-muted py-8">No tickets found.</p>
        )}
      </div>
    </div>
  );
}
